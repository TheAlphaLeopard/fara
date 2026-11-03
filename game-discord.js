class GameDiscordBot {
    constructor(serverUrl = 'https://fara-historian-dfd1389f0185.herokuapp.com') {
        this.serverUrl = serverUrl;
        this.auth = new DiscordAuthClient(); 
    }
    
    async sendGameEvent(message) {
        if (!this.auth.isLoggedIn()) {
            throw new Error('Must be logged in to send game events');
        }
        
        try {
            const response = await fetch(`${this.serverUrl}/api/game-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    userId: this.auth.userData.id,
                    username: this.auth.userData.global_name
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to send game event');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error sending game event:', error);
            throw error;
        }
    }

    async awardAchievement(achievement) {
        if (!this.auth.isLoggedIn()) {
            throw new Error('Must be logged in to earn achievements');
        }

        try {
            const response = await fetch(`${this.serverUrl}/api/achievements/award`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.auth.userData.id,
                    achievement: achievement
                })
            });

            if (!response.ok) {
                throw new Error('Failed to award achievement');
            }

            return await response.json();
        } catch (error) {
            console.error('Error awarding achievement:', error);
            throw error;
        }
    }

    async getUserRoles() {
        if (!this.auth.isLoggedIn()) {
            throw new Error('Must be logged in to fetch roles');
        }

        try {
            const response = await fetch(
                `${this.serverUrl}/api/user/roles/${this.auth.userData.id}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.code === 'USER_NOT_FOUND') {
                    throw new Error('You are not a member of the Discord server');
                }
                throw new Error('Failed to fetch roles');
            }

            const { roles } = await response.json();
            return roles;
        } catch (error) {
            console.error('Error fetching roles:', error);
            throw error;
        }
    }
}