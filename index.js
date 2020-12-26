const needle = require("needle");
const dotenv = require("dotenv").config();
const http = require("http");
const express = require("express");
const socket = require("socket.io");

const PORT = process.env.PORT || 5000;
const TOKEN = process.env.TWITTER_TOKEN;

const app = express();
const server = http.createServer(app);
const io = socket(server);
const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules";
const streamURL =
	"https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id";

const rules = [{ value: "coding" }];

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
const setRules = async () => {
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

const streamTweets = (socket) => {
	const stream = needle.get(streamURL, {
		headers: {
			Authorization: `Bearer ${TOKEN}`,
		},
	});

	stream.on("data", (data) => {
		try {
			const json = JSON.parse(data);
			// console.log(json);
			socket.emit("tweet", json);
		} catch (error) {}
	});
};

io.on("connection", async () => {
	let currentRules;
	try {
		currentRules = await getRules();
		await deleteRules(currentRules);
		await setRules();
	} catch (error) {
		console.error(error);
		process.exit(1);
	}

	streamTweets(io);
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
