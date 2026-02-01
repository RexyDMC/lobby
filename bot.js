const mineflayer = require('mineflayer');
const Movements = require('mineflayer-pathfinder').Movements;
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const { GoalBlock } = require('mineflayer-pathfinder').goals;
const config = require('./settings.json');

function createBot() {
		const bot = mineflayer.createBot({
				username: config['bot-account'].username,
				auth: config['bot-account'].type,
				host: config.server.ip,
				port: config.server.port,
				version: config.server.version
		});

		bot.loadPlugin(pathfinder);
		const mcData = require('minecraft-data')(bot.version);
		const defaultMove = new Movements(bot, mcData);

		bot.on('spawn', () => {
				console.log('✅ [BotLog] Bot joined to the server');

				// Auto-auth
				if (config.utils['auto-auth'].enabled) {
						console.log('[INFO] Started auto-auth module');
						const pass = config.utils['auto-auth'].password;
						setTimeout(() => {
								bot.chat(`/register ${pass} ${pass}`);
								bot.chat(`/login ${pass}`);
								console.log('[Auth] Authentication commands executed.');
						}, 500);
				}

				// Chat messages
				if (config.utils['chat-messages'].enabled) {
						console.log('[INFO] Started chat-messages module');
						const messages = config.utils['chat-messages'].messages;

						if (config.utils['chat-messages'].repeat) {
								const delay = config.utils['chat-messages']['repeat-delay'];
								let index = 0;

								setInterval(() => {
										bot.chat(messages[index]);
										index = (index + 1) % messages.length;
								}, delay * 1000);
						} else {
								messages.forEach(msg => bot.chat(msg));
						}
				}

				// Position
				if (config.position.enabled) {
						const pos = config.position;
						console.log(`[BotLog] Moving to (${pos.x}, ${pos.y}, ${pos.z})`);
						bot.pathfinder.setMovements(defaultMove);
						bot.pathfinder.setGoal(new GoalBlock(pos.x, pos.y, pos.z));
				}

				// Anti-AFK
				if (config.utils['anti-afk'].enabled) {
						bot.setControlState('jump', true);
						if (config.utils['anti-afk'].sneak) {
								bot.setControlState('sneak', true);
						}
				}
		});

		bot.on('error', (err) => {
				console.error('❌ [ERROR]', err.message);
		});

		bot.on('kicked', (reason) => {
				console.log('⚠️ [BotLog] Bot was kicked. Reason:', reason);
		});

		bot.on('end', () => {
				console.log('🔄 [BotLog] Connection ended');
				if (config.utils['auto-reconnect']) {
						setTimeout(() => {
								console.log('🔄 Reconnecting...');
								createBot();
						}, config.utils['auto-reconnect-delay']);
				}
		});
}

createBot();
