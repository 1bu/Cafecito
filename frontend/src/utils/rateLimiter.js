const RATE_LIMIT_KEY = 'spotify-rate-limit'
const COOLDOWN_TIME = 30 * 1000;

export const rateLimiter = {
    canAddSong(){
        const lastAddTime = this.getLastAddTime();
        const now = Date.now()
        
        console.log('🕐 Último agregado:', lastAddTime);  // ← DEBUG
        console.log('🕐 Ahora:', now);  // ← DEBUG
    
        if(!lastAddTime){
            console.log('✅ Primera vez, puede agregar');  // ← DEBUG
            return {allowed: true, timeLeft: 0}
        }

        const timePassed = now - lastAddTime;  // ← Corregido (estaba "timePasssed")
        console.log('⏱️ Tiempo pasado:', timePassed / 1000, 'segundos');  // ← DEBUG

        if(timePassed >= COOLDOWN_TIME){
            console.log('✅ Pasaron 30s, puede agregar');  // ← DEBUG
            return{ allowed: true, timeLeft: 0}
        }

        const timeLeft = Math.ceil((COOLDOWN_TIME - timePassed) / 1000);
        console.log('❌ NO puede agregar, faltan:', timeLeft, 'segundos');  // ← DEBUG
        return{
            allowed: false,
            timeLeft: timeLeft
        }
    },

    recordAdd(){  // ← Cambié de trackAdd() a recordAdd()
        const now = Date.now();
        console.log('📝 Registrando agregado en:', now);  // ← DEBUG
        localStorage.setItem(RATE_LIMIT_KEY, now.toString());
    },

    getLastAddTime(){
        const stored = localStorage.getItem(RATE_LIMIT_KEY);
        return stored ? parseInt(stored) : null;
    },

    reset(){
        localStorage.removeItem(RATE_LIMIT_KEY)
    },

    formatTimeLeft(seconds){
        if (seconds >= 60) {
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${minutes}m ${secs}s`;
        }
        return `${seconds}s`;
    }
};