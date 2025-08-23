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

   const { object } = await generateObject({
  model: google("gemini-2.0-flash-001", {
    structuredOutputs: false,
  }),
  schema: feedbackSchema,
  prompt: `
    You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. 
    Be thorough, strict, and honest. Do not be lenient under any circumstances. 

    If the candidate fails to answer a question, gives an incomplete response, or says "I don't know", assign a score of 0 for that category and explain why.

    Transcript:
    ${formattedTranscript}

    Evaluate and score the candidate from 0 to 100 in the following areas. 
    Provide a clear, detailed explanation for each score. Do not add extra categories.

    Categories:
    1. **Communication Skills**: Clarity, articulation, ability to provide structured responses.
    2. **Technical Knowledge**: Understanding of key concepts and ability to apply them to problems relevant to the role.
    3. **Problem-Solving**: Ability to analyze problems, break them down logically, and propose solutions.
    4. **Cultural & Role Fit**: Alignment with company values, team collaboration, and understanding of the role requirements.
    5. **Confidence & Clarity**: Confidence in responses, engagement, and clarity of delivery.

    Requirements:
    - Use a score from 0 to 100 for each category.
    - Explain clearly why each score was given.
    - If a candidate fails to respond, assigns "0" and describe the deficiency.
    - Be objective, professional, and thorough.
    - Provide constructive feedback, including areas for improvement.
  `,
  system: `
    You are a professional interviewer and AI evaluator. Your task is to assess a candidate's performance in a mock interview in a structured and strict manner.
    You must provide scores and detailed reasoning for each category.
  `,
});


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
