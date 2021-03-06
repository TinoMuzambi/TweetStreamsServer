const needle = require("needle");
const dotenv = require("dotenv").config();
const http = require("http");
const express = require("express");
const socket = require("socket.io");
const cors = require("cors");
const { exec } = require("child_process");

// Config
const PORT = process.env.PORT || 5000;
const TOKEN = process.env.TWITTER_TOKEN;

// Initialise server
const app = express();

// Middleware
app.use(cors());

// Create server and socket.io setup
const server = http.createServer(app);
const io = socket(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});
const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules";
const streamURL =
	"https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics,attachments&expansions=attachments.media_keys,author_id&media.fields=url,preview_image_url";
let stream;

// Get stream rules
const getRules = async () => {
	const response = await needle("get", rulesURL, {
		headers: {
			Authorization: `Bearer ${TOKEN}`,
		},
	});

	// console.log(response.body);
	return response.body;
};

// Set stream rules
const setRules = async (rules) => {
	const data = {
		add: rules,
	};

	const response = await needle("post", rulesURL, data, {
		headers: {
			"content-type": "application/json",
			Authorization: `Bearer ${TOKEN}`,
		},
	});

	return response.body;
};

// Delete stream rules
const deleteRules = async (rules) => {
	if (!Array.isArray(rules.data)) {
		return null;
	}

	const data = {
		delete: {
			ids: rules.data.map((rule) => rule.id),
		},
	};

	const response = await needle("post", rulesURL, data, {
		headers: {
			"content-type": "application/json",
			Authorization: `Bearer ${TOKEN}`,
		},
	});

	return response.body;
};

// Start streaming tweets.
const streamTweets = (socket) => {
	stream = needle.get(streamURL, {
		headers: {
			Authorization: `Bearer ${TOKEN}`,
		},
	});

	console.log("Streaming...");
	// stream.resume();

	stream.on("data", (data) => {
		try {
			const json = JSON.parse(data);
			// console.log("server", json);
			socket.local.emit("tweet", json);
		} catch (error) {}
	});
	setTimeout(() => {
		process.exit(0);
	}, 30000);
};

io.on("connection", async () => {
	console.log("Client connected");
});

// Server routes.
app.get("/start/:query", async (req, res) => {
	console.log("Starting");
	const rules = [{ value: `${req.params.query} has:media` }];

	let currentRules;
	try {
		currentRules = await getRules();
		await deleteRules(currentRules);
		await setRules(rules);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}

	res.status(200).send("Streaming");
	streamTweets(io);
});

app.get("/stop", async (req, res) => {
	console.log("Stopping");
	res.status(200).send("Stopped.");
	// process.exit(0);
	// exec("heroku restart", (error, stdout, stderr) => {
	// 	if (error) {
	// 		console.log(`error: ${error.message}`);
	// 		return;
	// 	}
	// 	if (stderr) {
	// 		console.log(`stderr: ${stderr}`);
	// 		return;
	// 	}
	// 	console.log(`stdout: ${stdout}`);
	// });
	// stream.pause();
});

app.get("/", (req, res) => {
	res.status(200).send("Tweet Streams Backend.");
});

// Server listen.
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
