/* eslint-disable max-len */
// /**
//  * Import function triggers from their respective submodules:
//  *
//  * import {onCall} from "firebase-functions/v2/https";
//  * import {onDocumentWritten} from "firebase-functions/v2/firestore";
//  *
//  * See a full list of supported triggers at https://firebase.google.com/docs/functions
//  */

// // import { onRequest } from "firebase-functions/v2/https";
// import { onObjectFinalized } from "firebase-functions/v2/storage";
// import * as logger from "firebase-functions/logger";
// // import { Blob } from "buffer";


// // import * as functions from "firebase-functions";
// import * as admin from "firebase-admin";
// // import { initializeApp } from 'firebase-admin/app';

// import * as fs from "fs";
// import { getStorage } from "firebase-admin/storage";
// // import { TextLoader } from "langchain/document_loaders/fs/text";
// import { createMongoDBConnection } from "./db/mongoLangChain/mongoDbClient";
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
// import { MongoDBAtlasVectorSearch } from "langchain/vectorstores/mongodb_atlas";
// import { OpenAIEmbeddings } from "langchain/embeddings/openai";


// admin.initializeApp();

// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript

// const mongoLangChainClient = createMongoDBConnection({
//   url: process.env.MONGODB_ATLAS_LANGCHAIN_URI || "",
//   dbName: process.env.MONGODB_ATLAS_LANGCHAIN_DB_NAME || "",
// });

// export const transcribeFile = onObjectFinalized(
//   { bucket: "Transcripts_Text" }
//   , async (event) => {
//     try {
//       const fileBucket = event.data.bucket; // Storage bucket
//       const filePath = event.data.name; // File path in the bucket.
//       const contentType = event.data.contentType; // File content type.


//       if (contentType !== "text/plain") {
//         return logger.log("This is not a text file.");
//       }

//       // Download file into memory from bucket.
//       const bucket = getStorage().bucket(fileBucket);
//       const downloadResponse = await bucket.file(filePath).download();
//       const textBuffer = downloadResponse[0];

//       // const blob = new Blob([textBuffer]); // JavaScript Blob

//       // const loader = new TextLoader(blob);
//       // const parentDocuments = await loader.load();

//       const text = fs.readFileSync(textBuffer, "utf8");
//       // const text = textBuffer.toString("utf-8");
//       const textSplitter = new RecursiveCharacterTextSplitter(
//         {
//           chunkSize: 1000,
//           chunkOverlap: 200, separators: ["\n\n", "\n", " ", ""],
//         });
//       // const docs = await textSplitter.splitDocuments(parentDocuments, {});

//       // Check if connected, and connect if not
//       if (!mongoLangChainClient.isConnected()) {
//         await mongoLangChainClient.connect();
//       }

//       const [objectId, category] = filePath.split("-");

//       const docs = await textSplitter.createDocuments(
//         [text],
//         [{
//           "userId": mongoLangChainClient.createObjectIdFromString(objectId),
//           "category": category,
//         }]
//       );

//       const collection = mongoLangChainClient.getDb().collection("transcripts");
//       await MongoDBAtlasVectorSearch.fromDocuments(
//         docs,
//         new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }),
//         {
//           collection: collection,
//           indexName: "default",
//           textKey: "text",
//           embeddingKey: "embedding",
//         }
//       );

//       // const fileContent = textBuffer.toString("utf-8");
//       console.log("Text content saved to MongoDB");
//     } catch (error) {
//       console.error("Error in Firebase function:", error);
//     } finally {
//       await mongoLangChainClient.closeConnection();
//     }
//   });
