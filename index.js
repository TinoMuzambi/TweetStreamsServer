const needle = require("needle");
const dotenv = require("dotenv").config();
const TOKEN = process.env.TWITTER_TOKEN;

const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules";
const streamURL =
	"https://api.twitter.com/2/tweets/search/stream/?tweet.fields=public_metrics&expansions=author_id";

const rules = [{ value: "giveaway" }];

// Get stream rules
const getRules = async () => {
	const response = await needle("get", rulesURL, {
		headers: {
			Authorization: `Bearer ${TOKEN}`,
		},
	});

	console.log(response.body);
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

(async () => {
	let currentRules;
	try {
		await setRules();
		currentRules = await getRules();
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
})();
