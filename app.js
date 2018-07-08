/*-----------------------------------------------------------------------------
This Bot uses the Bot Connector Service but is designed to showcase whats 
possible on Skype using the framework. The demo shows how to create a looping 
menu, use the built-in prompts, send Pictures, send Hero & Thumbnail Cards, 
send Receipts, and use Carousels. 

# RUN THE BOT:

    You can run the bot locally using the Bot Framework Emulator but for the best
    experience you should register a new bot on Skype and bind it to the demo 
    bot. You can then run the bot locally using ngrok found at https://ngrok.com/.

    * Install and run ngrok in a console window using "ngrok http 3978".
    * Create a bot on https://dev.botframework.com and follow the steps to setup
      a Skype channel.
    * For the endpoint you setup on dev.botframework.com, copy the https link 
      ngrok setup and set "<ngrok link>/api/messages" as your bots endpoint.
    * Next you need to configure your bots MICROSOFT_APP_ID, and
      MICROSOFT_APP_PASSWORD environment variables. If you're running VSCode you 
      can add these variables to your the bots launch.json file. If you're not 
      using VSCode you'll need to setup these variables in a console window.
      - MICROSOFT_APP_ID: This is the App ID assigned when you created your bot.
      - MICROSOFT_APP_PASSWORD: This was also assigned when you created your bot.
    * To use the bot you'll need to click the join link in the portal which will
      add it as a contact to your skype account. 
    * To run the bot you can launch it from VSCode or run "node app.js" from a 
      console window. 

-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var cron = require('node-cron');

//=========================================================
// Bot Setup
//=========================================================

var savedAddresses = [];
var randomLunchLocations = ["Hombre", "IJS"];

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Bot Storage: Here we register the state storage for your bot. 
// Default store: volatile in-memory store - Only for prototyping!
// We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
// For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
var inMemoryStorage = new builder.MemoryBotStorage();

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector).set('storage', inMemoryStorage); // Register in memory storage;
server.post('/api/messages', connector.listen());


//=========================================================
// Activity Events
//=========================================================

bot.on('conversationUpdate', function (message) {
   // Check for group conversations
    if (message.address.conversation.isGroup) {
        // Send a hello message when bot is added
        if (message.membersAdded) {
            message.membersAdded.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new builder.Message()
                            .address(message.address)
                            .text("Hello everyone!");
                    bot.send(reply);
                }
            });
        }

        // Send a goodbye message when bot is removed
        if (message.membersRemoved) {
            message.membersRemoved.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new builder.Message()
                        .address(message.address)
                        .text("Goodbye");
                    bot.send(reply);
                }
            });
        }
    }
});

bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
                .address(message.address)
                .text("Hello %s... Thanks for adding me.", name || 'there');
        bot.send(reply);
    } else {
        // delete their data
    }
});

bot.on('deleteUserData', function (message) {
    // User asked to delete their data
});


//=========================================================
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.
bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));

//=========================================================
// Bots Global Actions
//=========================================================

bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^(good)?bye/i });
bot.endConversationAction('hello', 'Hi there!', { matches: /^(hi|hello)/i });
bot.beginDialogAction('register', '/register', { matches: /^!register/i });

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', []);

// Create a dialog and bind it to a global action
bot.dialog('/register', [
    function (session, args) {
        savedAddresses.push(session.message.address);
        session.send("Registered this chat for periodic lunch messages.");
    }
]);

cron.schedule('* * * * *', function(){
    console.log('running a task every minute');

    savedAddresses.forEach(address => {
        let msg = new builder.Message().address(address);
        msg.text('Hello, this is a notification');
        bot.send(msg);
    });
});

cron.schedule('15 11 * * 1-5', function() {
    console.log('Sending go for lunch.');

    savedAddresses.forEach(address => {
        let msg = new builder.Message().address(address);
        msg.text('Go!');
        bot.send(msg);
    });
});

cron.schedule('15 10 * * 1,3,4,5', function() {
    console.log('Sending reminder for lunch.');

    savedAddresses.forEach(address => {
        let msg = new builder.Message().address(address);

        // Random lunch option
        var location = randomLunchLocations[Math.floor(Math.random()*randomLunchLocations.length)];
        msg.text('Lunch at %s at 11:15?', location);
        bot.send(msg);
    });
});

cron.schedule('15 10 * * 2', function() {
    console.log('Sending reminder for hood burger!');

    savedAddresses.forEach(address => {
        let msg = new builder.Message().address(address);
        msg.text('Hood burger at 11:15?');
        bot.send(msg);
    });
});

// todo remove this
cron.schedule('30 8 * * *', function() {
    console.log('Sending reminder for hood burger!');

    savedAddresses.forEach(address => {
        let msg = new builder.Message().address(address);
       // Random lunch option
       var location = randomLunchLocations[Math.floor(Math.random()*randomLunchLocations.length)];
       msg.text('Lunch at %s at 11:15?', location);
       bot.send(msg);
    });
});
