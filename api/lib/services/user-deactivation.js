import cron from 'node-cron';
import winston from 'winston';
import User from '../resource/model/user';

// Configuration constants (in days)
const WARNING_PERIOD = 7;           // Grace period after warning
const INACTIVITY_THRESHOLD = 365;   // Days of inactivity before warning

/**
 * Daily job to check and deactivate inactive user accounts
 * Runs at 2:00 AM every day
 */
const dailyDeactivationJob = async () => {
	winston.log('info', 'Starting daily user deactivation check...');

	try {
		const now = new Date();
		const warningCutoffDate = new Date(now.getTime() - WARNING_PERIOD * 24 * 60 * 60 * 1000);
		const inactivityCutoffDate = new Date(now.getTime() - INACTIVITY_THRESHOLD * 24 * 60 * 60 * 1000);

		// Deactivate accounts whose warning period has expired
		winston.log('info', 'Checking for users to deactivate...');
		const usersToDeactivate = await findUsersToDeactivate(warningCutoffDate);
		
		for (const user of usersToDeactivate) {
			try {
				user.isDeactivated = true;
				await user.save();
				winston.log('info', `Deactivated user: ${user._id} (warning sent: ${user.warningSentDate})`);
			} catch (error) {
				winston.log('error', `Failed to deactivate user ${user._id}: ${error.message}`);
			}
		}

		// Warn users who have just become inactive
		winston.log('info', 'Checking for users to warn...');
		const usersToWarn = await findUsersToWarn(inactivityCutoffDate);
		
		for (const user of usersToWarn) {
			try {
				user.warningSentDate = now.toISOString();
				await user.save();
				winston.log('info', `Warning sent to user: ${user._id} (last login: ${user.lastLogin})`);
				// Note: External notification system should handle sending the actual email
			} catch (error) {
				winston.log('error', `Failed to update warning for user ${user._id}: ${error.message}`);
			}
		}

		winston.log('info', `Deactivation check completed. Deactivated: ${usersToDeactivate.length}, Warned: ${usersToWarn.length}`);
	} catch (error) {
		winston.log('error', `Error during deactivation job: ${error.message}`);
	}
};

/**
 * Find users whose warning period has expired and need to be deactivated
 */
async function findUsersToDeactivate(warningCutoffDate) {
	try {
		const allUsers = await User.storeInstance.list();
		
		return allUsers.filter(user => {
			if (!user.warningSentDate) return false;
			if (user.isDeactivated) return false;
			
			// Warning must be older than the grace period
			const warningSentDate = new Date(user.warningSentDate);
			return warningSentDate < warningCutoffDate;
		});
	} catch (error) {
		winston.log('error', `Error finding users to deactivate: ${error.message}`);
		return [];
	}
}

/**
 * Find users who have been inactive and need to be warned
 */
async function findUsersToWarn(inactivityCutoffDate) {
	try {
		const allUsers = await User.storeInstance.list();
		
		return allUsers.filter(user => {
			if (!user.lastLogin) return false;
			if (user.warningSentDate) return false;
			if (user.isDeactivated) return false;
			
			// Last login must be older than the inactivity threshold
			const lastLoginDate = new Date(user.lastLogin);
			return lastLoginDate < inactivityCutoffDate;
		});
	} catch (error) {
		winston.log('error', `Error finding users to warn: ${error.message}`);
		return [];
	}
}

/**
 * Initialize the deactivation cron job
 * Runs daily at 2:00 AM
 */
export function initializeDeactivationJob() {
	// Schedule: '0 2 * * *' = At 2:00 AM every day
	cron.schedule('0 2 * * *', dailyDeactivationJob, {
		scheduled: true,
		timezone: "UTC"
	});
	winston.log('info', 'User deactivation cron job initialized (runs daily at 2:00 AM UTC)');
}

/**
 * Run the deactivation job immediately (for testing purposes)
 */
export async function runDeactivationJobNow() {
	winston.log('info', 'Running deactivation job manually...');
	await dailyDeactivationJob();
}