import React from 'react';
// Import the class with an alias to avoid naming conflict
import { SeasonSimulator as SeasonSimulatorEngine } from './season-simulator-class';

// League options
const leagues = [
  { id: 'epl', name: 'English Premier League' },
  { id: 'laliga', name: 'La Liga' },
  { id: 'bundesliga', name: 'Bundesliga' },
  { id: 'seriea', name: 'Serie A' },
  { id: 'ligue1', name: 'Ligue 1' }
];

// Season options
const seasons = [
  { id: '2023-2024', name: '2023-2024' },
  { id: '2024-2025', name: '2024-2025' }
];

// RENAMED: Changed from SeasonSimulatorComponent to SeasonSimulator
export const SeasonSimulator = () => {
  const [selectedLeague, setSelectedLeague] = React.useState("epl");
  const [selectedSeason, setSelectedSeason] = React.useState("2023-2024");
  const [isSimulating, setIsSimulating] = React.useState(false);
  const [simulationResults, setSimulationResults] = React.useState(null);

  const handleSimulation = async () => {
    setIsSimulating(true);
    try {
      // Here you would instantiate the SeasonSimulatorEngine class and run simulation
      // const simulator = new SeasonSimulatorEngine(teamModels, historicalStats);
      // const results = await simulator.simulateSeason(matches, leagueId, leagueName, season);
      // setSimulationResults(results);
      
      // For now, just simulate the loading
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log(`Simulating ${selectedLeague} for ${selectedSeason}`);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Season Simulator</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select League
            </label>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {leagues.map(league => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Season
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {seasons.map(season => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          onClick={handleSimulation}
          disabled={isSimulating}
          className={`w-full py-3 px-4 rounded-md font-medium ${
            isSimulating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          } text-white transition-colors`}
        >
          {isSimulating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Simulating Season...
            </span>
          ) : (
            'Start Season Simulation'
          )}
        </button>
      </div>
      
      {simulationResults && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Simulation Results</h2>
          {/* Display simulation results here */}
          <p className="text-gray-600">Results will be displayed here...</p>
        </div>
      )}
      
      {isSimulating && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Simulation in Progress</h3>
          <p className="text-blue-700">
            Simulating {leagues.find(l => l.id === selectedLeague)?.name} season {selectedSeason}...
          </p>
          <div className="mt-4">
            <div className="bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// If you need to export it as SeasonSimulator for compatibility, you can do:
// export { SeasonSimulatorComponent as SeasonSimulator };