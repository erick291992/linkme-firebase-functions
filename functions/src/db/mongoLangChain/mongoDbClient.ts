import { MongoClient, Db, ObjectId } from "mongodb";

interface MongoDBConnectionOptions {
  url: string;
  dbName: string;
}

class MongoDBConnection {
  private static client: MongoClient | null = null;
  private static connected = false;

  constructor(private readonly options: MongoDBConnectionOptions) { }

  public async connect(): Promise<void> {
    if (!MongoDBConnection.client) {
      MongoDBConnection.client = new MongoClient(this.options.url);
      await MongoDBConnection.client.connect();
      MongoDBConnection.connected = true;
    }
  }

  public getDb(): Db {
    if (!MongoDBConnection.client) {
      throw new Error("MongoDB not connected. Call connect first.");
    }
    return MongoDBConnection.client.db(this.options.dbName);
  }

  public async closeConnection(): Promise<void> {
    if (MongoDBConnection.client) {
      await MongoDBConnection.client.close();
      MongoDBConnection.client = null;
      MongoDBConnection.connected = false;
    }
  }

  public getNewObjectId(): ObjectId {
    if (!MongoDBConnection.client) {
      throw new Error("MongoDB not connected. Call connect first.");
    }
    return new ObjectId();
  }

  public createObjectIdFromString(id: string): ObjectId {
    if (!MongoDBConnection.client) {
      throw new Error("MongoDB not connected. Call connect first.");
    }
    return new ObjectId(id);
  }

  public isConnected(): boolean {
    return MongoDBConnection.connected;
  }
}

export const createMongoDBConnection = (
  options: MongoDBConnectionOptions
): MongoDBConnection => {
  const connection = new MongoDBConnection(options);
  return connection;
};
