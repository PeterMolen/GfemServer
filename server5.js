// require('dotenv').config();
const express = require('express');
const { Client } = require('@notionhq/client');
const bodyParser = require('body-parser');
const app = express();
const corsOptions = {
  origin: "http://localhost:3000", // Ersätt med din React-apps ursprung
  optionsSuccessStatus: 200, // vissa äldre browsers (IE11, olika SmartTVs) hanterar 204 som en error
};
 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('cors')(corsOptions));
app.use(bodyParser.json());
const notion = new Client({ auth: 'secret_wPFJXkQdBHy2tQNynftsS7C1w0jTcktlaBZtpC3X4ns' });
const databaseId = 'fd1181aaffe949c8805924b83b0604e6';
 
app.get('/api/notion', async (req, res) => {
  try {
    const response = await notion.databases.query({ database_id: databaseId });
    res.json(response.results);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  }
});
 
app.patch('/api/edit-notion-entry', async (req, res) => {
  const { pageId, updatedProperties } = req.body;
  try {
    const response = await notion.pages.update({
      page_id: pageId,
      properties: updatedProperties,
    });
    res.json(response);
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: error.message });
  }
});
 
app.post('/api/add-notion-project', async (req, res) => {
    const { projectName, status, hours, timespanStart, timespanEnd } = req.body;
    try {
      const response = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          Projectname: {
            title: [
              {
                text: {
                  content: projectName,
                },
              },
            ],
          },
          Status: {
            select: {
              name: status,
            },
          },
          Hours: {
            number: hours,
          },
          Timespan: {
            date: {
              start: timespanStart,
              end: timespanEnd,
            },
          },
          // Add other properties as needed
        },
      });
      res.json(response);
    } catch (error) {
      console.error('Error adding new project:', error);
      res.status(500).send('Error adding new project');
    }
  });

  app.get('/projects', async (req, res) => {
    try {
      const response = await notion.databases.query({ database_id: databaseId });
      res.json(response.results);
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Error fetching data');
    }
  });

  app.get('/persons', async (req, res) => {
    try {
      const response = await notion.databases.query({ database_id: "678dbfaa766f4d479bdd43108fc2c743" });
      res.json(response.results);
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Error fetching data');
    }
  });
  
   
  // Endpoint för att skapa en ny tidrapport i Notion-databasen
  app.post('/timereports', async (req, res) => {
    // Extraherar data skickad från klienten
    const { projectId, hours, date, note, person } = req.body;
   
    try {
      // Skapar en ny sida (tidrapport) i Notion med angiven data
      const response = await notion.pages.create({
        parent: { database_id: "95053152f55d4969a1523477d2b0dfbc" }, // Anger vilken databas sidan ska skapas i
        properties: {
          // Anger egenskaper för den nya sidan baserat på input från klienten
          'Projects': {
            type: 'relation', // Anger relationstyp, kopplar till ett projekt via dess ID
            relation: [{ id: projectId }],
          },
          'Hours': {
            type: 'number', // Anger antalet timmar som en numerisk egenskap
            number: hours,
          },
          'Date': {
            type: 'date', // Anger datumet för tidrapporten
            date: {
              start: date,
            },
          },
          'Note': {
            title: [ // Använder titel-fältet för anteckningar, kan behöva anpassas beroende på din databasstruktur
              {
                text: {
                  content: note,
                },
              },
            ],
          },
          'Person': { 
            type: "relation", // Lägger in inloggad användare som person
            relation: [{ id: person}]
          },
        },
      });
      // Skickar tillbaka ett bekräftelsemeddelande och det skapade objektets ID till klienten
      res.json({ id: response.id, status: 'Skapad' });
    } catch (error) {
      // Loggar eventuella fel och skickar ett felmeddelande till klienten
      console.error(error);
      res.status(500).send('Serverfel vid skapande av tidraport');
    }
  });
 
 
  // hämtar projects för användare
 
  app.post("/login", async (req, res) => {
    const { notionname, password } = req.body;
    try {
      const response = await notion.databases.query({
        database_id: "678dbfaa766f4d479bdd43108fc2c743",
      });
   
      const user = response.results.find((user) => {
        // Safely access properties with optional chaining and provide default values
        const userNotionName = user.properties.Name?.title[0]?.plain_text ?? "";
        const userPassword = user.properties.Password?.rich_text[0]?.plain_text ?? "";
        return userNotionName === notionname && userPassword === password; // Adjusted comparison logic
      });
      if (user) {
        res.json({
          message: "Success",
          user: user.properties.Name?.title[0]?.plain_text, // Safely access with optional chaining
          userid: user.properties.PrivateId?.rich_text[0]?.plain_text, // Safely access with optional chaining
          nameid: user.id,
          userRole: user.properties.Roll.multi_select[0].name,
        });
      } else {
        res.status(401).json({ message: "Authentication failed" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });


  app.post("/getdatabasebyid", async (req, res) => {
    const databaseId = req.body.databaseId; // Anta att databas-ID skickas i request body
    const creatorId = req.body.creatorId; // Anta att skaparens ID också skickas i request body
   console.log("creator id: " + creatorId)
    const notion = new Client({
      auth: "secret_wPFJXkQdBHy2tQNynftsS7C1w0jTcktlaBZtpC3X4ns",
    });
    try {
      const response = await notion.databases.query({
        database_id: databaseId,
        // Include other filters as needed, excluding 'created_by'
      });
      // Example filtering logic (modify based on your actual data structure)
      const filteredResults = response.results.filter(
        (page) => {
          
          // const pageCreatorId = page.properties.People.relation.some(obj=>obj.id === creatorId); // För att hämta via People-egenskapen istället för Persons.

          const pageCreatorId = page.properties.Persons.rollup.array.some(obj=>obj.relation[0].id === creatorId);

          console.log("creator id 2: " + creatorId)
          console.log("test " + pageCreatorId)
          return pageCreatorId;
        }
      );
      res.json(filteredResults);
      //res.json(response.results);
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error when fetching data from Notion");
    }
  });


  app.post("/changetime", async (req, res) => {
    const { pageId, start, end } = req.body;
   
    // Update the page in Notion using the Notion SDK
    try {
      const response = await notion.pages.update({
        page_id: pageId,
        properties: {
          // Assumes 'Timespan' is the property name in your Notion database
          Timespan: {
            date: {
              start: start,
              end: end,
            },
          },
        },
      });
   
      res.json({ message: 'Timespan updated successfully', response });
    } catch (error) {
      console.error('Failed to update timespan in Notion:', error);
      res.status(500).json({ message: 'Failed to update timespan', error: error.message });
    }
  });
 
 
 
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});