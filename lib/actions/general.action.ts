"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;
const userSnap = await db.collection("users").doc(userId).get();
const userData = userSnap.data();

const candidateName = userData?.name || "Candidate";
const email = userData?.email || "candidate@example.com";
  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

  const { object } = await generateObject({ model: google("gemini-2.0-flash-001", { structuredOutputs: false, }), schema: feedbackSchema, prompt: You are an AI interviewer analyzing a mock interview session. Your task is to evaluate the candidate strictly and professionally based on structured performance categories. Important Instructions: - Be **thorough**, **honest**, and **uncompromising** in your evaluations. - If the **candidate fails to respond**, gives an **incomplete** or **"I don't know"** answer, or if the **microphone is not connected** (i.e., there is **no audible input**), assign a **score of 0** for the affected category. Clearly explain the reason (e.g., "No audio detected due to microphone connectivity issue"). - Do **not be lenient** under any circumstances. - Provide clear, direct, and constructive feedback for improvement. - Do **not** introduce extra categories or ignore any of the required ones. Evaluation Categories (Score each from **0 to 100**): 1. **Communication Skills** - Measures clarity, structure, grammar, fluency, and articulation. - Assess how effectively the candidate conveys ideas. 2. **Technical Knowledge** - Evaluate the candidate’s understanding of core technical concepts. - Includes the ability to apply knowledge to practical or theoretical problems relevant to the role. 3. **Problem-Solving** - Analyze how the candidate approaches and breaks down problems. - Look for logical thinking, analytical depth, and creativity in solution strategies. 4. **Cultural & Role Fit** - Determine the candidate’s understanding of the role and alignment with the company’s values and working style. - Includes collaboration, motivation, and awareness of team dynamics. **Confidence & Clarity** - Evaluate the candidate’s presence, confidence, tone, and ability to express answers clearly and decisively. If any of the following occur: - No answer is given for a question - Candidate responds with “I don’t know” or an equivalent - Microphone is not connected or the response is inaudible Then assign a score of **0** for that specific category and clearly state the issue. Interview Transcript: ${formattedTranscript} Your Task: Evaluate the candidate’s responses **objectively** and **professionally**. Assign a score from 0 to 100 for each category and include a **detailed explanation** justifying the score. Highlight areas for improvement in a constructive manner. , });

const feedback = {
  interviewId,
  userId,
  candidateName, 
  email,         
  totalScore: object.totalScore,
  categoryScores: object.categoryScores,
  strengths: object.strengths,
  areasForImprovement: object.areasForImprovement,
  finalAssessment: object.finalAssessment,
  createdAt: new Date().toISOString(),
};


    let feedbackRef;

    if (feedbackId) {
feedbackRef = db.collection("interviewsfeedback").doc();
    } else {
feedbackRef = db.collection("interviewsfeedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();

  return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await db
  .collection("interviewsfeedback")
  .where("interviewId", "==", interviewId)
  .where("userId", "==", userId)
  .limit(1)
  .get();
  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}
