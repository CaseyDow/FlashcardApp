# FlashcardApp

This is the GitHub repository for a flashcards app, which allows users to upload and share flashcards.

This is created by Casey Dow, Wilson Lu, Katherine Chen, Alex Marcoline, and Connor Tung for CS 35L. 


### Set up MongoDB
* Create a MongoDB Account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
* Create a Cluster. Choose a plan, cluster name, service provider, and region, then Create Deployment.
* Add your current IP address, or optionally, add another IP address or allow access from anywhere. Add a database user for yourself. 
* Choose `Drivers` as your connection method on the next page, then note down the connection string. Make sure to replace the password with the one created for your user. 

## Setting up
Clone the git repository onto your machine:
```
git clone https://github.com/CaseyDow/FlashcardApp.git
cd FlashcardApp
npm init --yes
```

Inside of `server/`, create a file named `.env` with your private keys
```
MONGODB_URI=[MongoDB Connection String]
JWT_SECRET=[Make any Secret Code]
```

## Running the project
In a terminal, inside of the `server/` subdirectory, run 
```
npm install
npm start
```

In another terminal, inside of the `client/` subdirectory, run 
```
npm install
npm run dev
```

Then, open up the project in a browser. The local URL is displayed by the client terminal. The default is http://localhost:5173

## Features:
User Authentication
Flashcard Deck Search
Public/Private Flashcards
Flashcard Deck Upload/Download
Flashcard Creation and Editing
Flashcard Studying

Tools Used:
React, Node.js, MongoDB
