import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT || 5000;

async function Main() {
  try {
    // await prisma.$connect();
    console.log("Connected to the database successfully.");

    app.listen(PORT, () => {
      console.log(`Server is running on the port ${PORT}`);
    });
  } catch (error) {
    console.log("An error occurred: ", error);
  }
}

Main();
