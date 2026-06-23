import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

// ---- Schemas ----
const GenerateInput = z.object({
  topic: z.string().min(2).max(120),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  numQuestions: z.number().int().min(3).max(15).default(5),
});

const QuestionSchema = z.object({
  q: z.string(),
  options: z.array(z.string()).length(4),
  correct: z.number().int().min(0).max(3),
  explanation: z.string(),
  subtopic: z.string().optional(),
});

const QuizSchema = z.object({
  questions: z.array(QuestionSchema),
});

export type QuizQuestion = z.infer<typeof QuestionSchema>;

// ---- Generate quiz + create attempt ----
export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GenerateInput.parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const { experimental_output } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      experimental_output: Output.object({ schema: QuizSchema }),
      system:
        "You are a meticulous exam author. Generate factual, single-answer multiple-choice questions with exactly 4 options. Vary difficulty appropriately. Make distractors plausible. Provide a concise 1-2 sentence explanation citing why the correct option is right.",
      prompt: `Create a ${data.difficulty} difficulty quiz on the topic: "${data.topic}".
Number of questions: ${data.numQuestions}.
Cover distinct subtopics. Tag each question with its subtopic.
Return strictly the JSON schema.`,
    });

    const quiz = experimental_output as z.infer<typeof QuizSchema>;
    if (!quiz?.questions?.length) throw new Error("AI returned no questions");

    const { data: row, error } = await context.supabase
      .from("quiz_attempts")
      .insert({
        user_id: context.userId,
        topic: data.topic,
        difficulty: data.difficulty,
        num_questions: quiz.questions.length,
        questions: quiz.questions,
        answers: Array(quiz.questions.length).fill(null),
        status: "in_progress",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { attemptId: row.id as string };
  });

// ---- Get attempt ----
export const getAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("quiz_attempts")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---- Submit attempt ----
const SubmitInput = z.object({
  id: z.string().uuid(),
  answers: z.array(z.number().int().min(0).max(3).nullable()),
  durationSeconds: z.number().int().min(0),
});

export const submitAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SubmitInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("quiz_attempts")
      .select("questions, num_questions, status")
      .eq("id", data.id)
      .eq("user_id", userId)
      .single();
    if (error) throw new Error(error.message);
    if (row.status === "completed") return { alreadyCompleted: true, attemptId: data.id };

    const questions = row.questions as QuizQuestion[];
    let correct = 0;
    questions.forEach((q, i) => {
      if (data.answers[i] === q.correct) correct += 1;
    });

    const { error: upErr } = await supabase
      .from("quiz_attempts")
      .update({
        answers: data.answers,
        correct_count: correct,
        duration_seconds: data.durationSeconds,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (upErr) throw new Error(upErr.message);

    // Stats + streak
    const { data: stats } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);

    const last = stats?.last_quiz_date ?? null;
    let streak = stats?.streak_days ?? 0;
    if (last === today) {
      // same-day, keep streak
    } else if (last === yesterday) {
      streak = (streak || 0) + 1;
    } else {
      streak = 1;
    }
    const longest = Math.max(stats?.longest_streak ?? 0, streak);
    const xpEarned = correct * 10 + (correct === questions.length ? 25 : 0);

    const newStats = {
      user_id: userId,
      xp: (stats?.xp ?? 0) + xpEarned,
      streak_days: streak,
      longest_streak: longest,
      last_quiz_date: today,
      total_quizzes: (stats?.total_quizzes ?? 0) + 1,
      total_correct: (stats?.total_correct ?? 0) + correct,
      total_questions: (stats?.total_questions ?? 0) + questions.length,
      updated_at: new Date().toISOString(),
    };
    await supabase.from("user_stats").upsert(newStats, { onConflict: "user_id" });

    // Badge awards
    const { data: badges } = await supabase.from("badges").select("id, code, criteria_type, criteria_value");
    const newlyEarned: string[] = [];
    if (badges) {
      const { data: owned } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", userId);
      const ownedSet = new Set((owned ?? []).map((b) => b.badge_id as string));
      for (const b of badges) {
        if (ownedSet.has(b.id as string)) continue;
        let earned = false;
        if (b.criteria_type === "quizzes" && newStats.total_quizzes >= b.criteria_value) earned = true;
        if (b.criteria_type === "streak" && newStats.streak_days >= b.criteria_value) earned = true;
        if (b.criteria_type === "xp" && newStats.xp >= b.criteria_value) earned = true;
        if (b.criteria_type === "perfect" && correct === questions.length) earned = true;
        if (earned) {
          await supabase.from("user_badges").insert({ user_id: userId, badge_id: b.id });
          newlyEarned.push(b.code as string);
        }
      }
    }

    return {
      attemptId: data.id,
      correct,
      total: questions.length,
      xpEarned,
      newBadges: newlyEarned,
    };
  });

// ---- Dashboard data ----
export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: stats }, { data: recent }, { data: profile }, { data: badges }] =
      await Promise.all([
        supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
        supabase
          .from("quiz_attempts")
          .select("id, topic, difficulty, correct_count, num_questions, status, created_at, completed_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("profiles").select("display_name, avatar_url").eq("id", userId).maybeSingle(),
        supabase
          .from("user_badges")
          .select("earned_at, badges(code,name,description,icon)")
          .eq("user_id", userId)
          .order("earned_at", { ascending: false }),
      ]);
    return {
      stats: stats ?? null,
      recent: recent ?? [],
      profile: profile ?? null,
      badges: badges ?? [],
    };
  });

// ---- Leaderboard (top 50 by XP) ----
export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_stats")
      .select("user_id, xp, streak_days, total_quizzes, total_correct, total_questions, profiles!inner(display_name, avatar_url)")
      .order("xp", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---- Analytics (weak topics, accuracy over time) ----
export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("quiz_attempts")
      .select("topic, difficulty, correct_count, num_questions, duration_seconds, completed_at, questions, answers")
      .eq("user_id", context.userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: true })
      .limit(100);
    if (error) throw new Error(error.message);

    const byTopic = new Map<string, { correct: number; total: number }>();
    const timeSeries: { date: string; accuracy: number }[] = [];
    let totalTime = 0;
    let totalQs = 0;

    for (const a of data ?? []) {
      const t = a.topic || "General";
      const cur = byTopic.get(t) ?? { correct: 0, total: 0 };
      cur.correct += a.correct_count ?? 0;
      cur.total += a.num_questions ?? 0;
      byTopic.set(t, cur);
      const date = (a.completed_at ?? "").slice(0, 10);
      const acc = a.num_questions ? (a.correct_count ?? 0) / a.num_questions : 0;
      timeSeries.push({ date, accuracy: Math.round(acc * 100) });
      totalTime += a.duration_seconds ?? 0;
      totalQs += a.num_questions ?? 0;
    }

    const topics = Array.from(byTopic.entries())
      .map(([topic, v]) => ({ topic, accuracy: v.total ? Math.round((v.correct / v.total) * 100) : 0, total: v.total }))
      .sort((a, b) => a.accuracy - b.accuracy);

    return {
      topics,
      timeSeries,
      avgSecondsPerQuestion: totalQs ? Math.round(totalTime / totalQs) : 0,
      totalAttempts: data?.length ?? 0,
    };
  });
