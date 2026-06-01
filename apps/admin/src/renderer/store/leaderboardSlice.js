import { createSlice } from '@reduxjs/toolkit'

const leaderboardSlice = createSlice({
    name: 'leaderboard',
    initialState: {
        circuits: {},
        settings: {
            slideDuration: 10,
            adminPassword: 'elsass'
        },
        loaded: false
    },
    reducers: {
        setDB(state, action) {
            state.circuits = action.payload.circuits
            state.settings = action.payload.settings
            state.loaded = true
        }
    }
})

export const { setDB } = leaderboardSlice.actions
export default leaderboardSlice.reducer