/* eslint-disable max-len */
import { onObjectFinalized } from "firebase-functions/v2/storage";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";

import { getStorage } from "firebase-admin/storage";
import { createMongoDBConnection } from "./db/mongoLangChain/mongoDbClient";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MongoDBAtlasVectorSearch } from "langchain/vectorstores/mongodb_atlas";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";


initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

const mongoLangChainClient = createMongoDBConnection({
  url: process.env.MONGODB_ATLAS_URI || "",
  dbName: process.env.MONGODB_ATLAS_LANGCHAIN_DB_NAME || "",
});

export const transcribeFile = onObjectFinalized(async (event) => {
  try {
    const fileBucket = event.data.bucket; // Storage bucket
    const filePath = event.data.name; // File path in the bucket.
    const contentType = event.data.contentType; // File content type.
    const metadata = event.data.metadata;

    console.log("fileBucket:", fileBucket);
    console.log("filePath:", filePath);
    console.log("contentType:", contentType);
    if (contentType !== "text/plain") {
      return logger.log("This is not a text file.");
    }
    console.log("metadata:", metadata);

    // if (metadata) {
    //   // Extract metadata properties
    //   const fileName = metadata.fileName;
    //   const postId = metadata.postId;
    //   const userId = metadata.userId;
    //   const chatHistoryId = metadata.chatHistoryId;
    //   const fileId = metadata.fileId;

    //   // Use the extracted metadata properties as needed
    //   console.log("fileName:", fileName);
    //   console.log("postId:", postId);
    //   console.log("userId:", userId);
    //   console.log("chatHistoryId:", chatHistoryId);
    //   console.log("fileId:", fileId);
    // }

    // Download file into memory from bucket.
    const bucket = getStorage().bucket(fileBucket);
    console.log("got bucket:");
    const downloadResponse = await bucket.file(filePath).download();
    console.log("downloaded file:", downloadResponse.length);
    const textBuffer = downloadResponse[0];
    console.log("loaded buffer:");
    // const blob = new Blob([textBuffer]); // JavaScript Blob

    // const loader = new TextLoader(blob);
    // const parentDocuments = await loader.load();

    const text = textBuffer.toString("utf-8");
    // const text = fs.readFileSync(textBuffer, "utf8");
    console.log("found text:");
    const textSplitter = new RecursiveCharacterTextSplitter(
      {
        chunkSize: 1000,
        chunkOverlap: 200, separators: ["\n\n", "\n", " ", ""],
      });

    console.log("created text splitter:");
    // Check if connected, and connect if not
    if (!mongoLangChainClient.isConnected()) {
      await mongoLangChainClient.connect();
      console.log("Connected to MongoDB");
    }

    const parts = filePath.split("/");
    const fileName = parts[1];
    // const [objectId, category] = fileName.split("-");
    const [
      fileId, chatHistoryId, firebaseUserId, postId, category, date,
    ] = fileName.split("-");
    console.log("fileId:", fileId);
    console.log("chatHistoryId:", chatHistoryId);
    console.log("firebaseUserId:", firebaseUserId);
    console.log("postId:", postId);
    console.log("category:", category);
    console.log("date:", date);

    const docs = await textSplitter.createDocuments(
      [text],
      [{
        "fileId": mongoLangChainClient.createObjectIdFromString(fileId),
        "chatHistoryId": mongoLangChainClient.createObjectIdFromString(chatHistoryId),
        "firebaseUserId": firebaseUserId,
        "category": category,
      }]
    );
    console.log("Created documents");

    const collection = mongoLangChainClient.getDb().collection("transcripts");
    await MongoDBAtlasVectorSearch.fromDocuments(
      docs,
      new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }),
      {
        collection: collection,
        indexName: "default",
        textKey: "text",
        embeddingKey: "embedding",
      }
    );

    // const fileContent = textBuffer.toString("utf-8");
    console.log("Text content saved to MongoDB");
  } catch (error) {
    console.error("Error in Firebase function:", error);
  } finally {
    await mongoLangChainClient.closeConnection();
    console.log("Closed MongoDB connection");
  }
});
