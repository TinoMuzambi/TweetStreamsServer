const needle = require("needle");
const dotenv = require("dotenv").config();
const TOKEN = process.env.TWITTER_TOKEN;

const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules";
const streamURL =
	"https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id";

const rules = [{ value: "giveaway" }];

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

const streamTweets = () => {
	const stream = needle.get(streamURL, {
		headers: {
			Authorization: `Bearer ${TOKEN}`,
		},
	});

	stream.on("data", (data) => {
		try {
			const json = JSON.parse(data);
			console.log(json);
		} catch (error) {}
	});
};

(async () => {
	let currentRules;
	try {
		currentRules = await getRules();
		await deleteRules(currentRules);
		await setRules();
	} catch (error) {
		console.error(error);
		process.exit(1);
	}

	streamTweets();
})();
