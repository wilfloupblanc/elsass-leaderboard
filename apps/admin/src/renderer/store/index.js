import { configureStore } from '@reduxjs/toolkit'
import leaderboardReducer from './leaderboardSlice.js'

export const store = configureStore({
    reducer: {
        leaderboard: leaderboardReducer
    }
})