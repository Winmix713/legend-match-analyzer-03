import React from "react";
import { Card, CardBody, CardHeader, Select, SelectItem, Button, Tabs, Tab, Divider, Progress } from "@heroui/react";
import { Icon } from "@iconify/react";

const teams = [
  { label: "Arsenal", value: "arsenal" },
  { label: "Chelsea", value: "chelsea" },
  { label: "Liverpool", value: "liverpool" },
  { label: "Manchester City", value: "man_city" },
  { label: "Manchester United", value: "man_utd" },
  { label: "Tottenham", value: "tottenham" },
  { label: "Barcelona", value: "barcelona" },
  { label: "Real Madrid", value: "real_madrid" },
  { label: "Atletico Madrid", value: "atletico" },
  { label: "Bayern Munich", value: "bayern" },
  { label: "Borussia Dortmund", value: "dortmund" },
  { label: "PSG", value: "psg" },
];

export const MatchPrediction = () => {
  const [homeTeam, setHomeTeam] = React.useState("arsenal");
  const [awayTeam, setAwayTeam] = React.useState("chelsea");
  const [isPredicting, setIsPredicting] = React.useState(false);
  const [hasPrediction, setHasPrediction] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState("results");
  const [predictionResult, setPredictionResult] = React.useState<any>(null);

  const handlePredict = async () => {
    setIsPredicting(true);
    
    try {
      // In a real implementation, we would:
      // 1. Fetch match data for the selected teams
      // 2. Fetch team models for both teams
      // 3. Create a MatchPredictor instance
      // 4. Generate and save the prediction
      // 5. Update the UI with results
      
      // For this example, we'll simulate the process
      // Create mock team models (in real app, these would be loaded from database)
      const homeTeamModel = new TeamModelManager(
        1, // team ID
        teams.find(t => t.value === homeTeam)?.label || "Unknown Team",
        "home"
      );
      
      const awayTeamModel = new TeamModelManager(
        2, // team ID
        teams.find(t => t.value === awayTeam)?.label || "Unknown Team",
        "away"
      );
      
      // Create a match predictor
      const predictor = new MatchPredictor(homeTeamModel, awayTeamModel);
      
      // Generate prediction (with mock match data)
      const mockMatch = {
        id: 12345,
        league_id: 1,
        league_name: "English Premier League",
        season: "2023-2024",
        match_date: new Date().toISOString(),
        home_team_id: 1,
        home_team: teams.find(t => t.value === homeTeam)?.label || "Unknown Team",
        away_team_id: 2,
        away_team: teams.find(t => t.value === awayTeam)?.label || "Unknown Team",
        home_goals_ht: 0,
        away_goals_ht: 0,
        home_goals_ft: 0,
        away_goals_ft: 0,
        result_1x2: "1",
        result_ou25: "O",
        result_btts: "yes",
        result_htft: "1/1",
        odds_1: 2.1,
        odds_x: 3.4,
        odds_2: 3.2,
        odds_o25: 1.9,
        odds_u25: 2.0,
        odds_btts_yes: 1.8,
        odds_btts_no: 2.1,
        odds_htft: { "1/1": 4.5, "1/X": 15.0, "1/2": 26.0, "X/1": 6.5, "X/X": 5.5, "X/2": 10.0, "2/1": 23.0, "2/X": 15.0, "2/2": 7.5 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const prediction = predictor.predict(mockMatch);
      setPredictionResult(prediction);
      setHasPrediction(true);
    } catch (error) {
      console.error("Error generating prediction:", error);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold">Match Prediction</h2>
        <p className="text-default-500">Analyze and predict match outcomes</p>
      </div>

      <Card>
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md font-semibold">Match Selection</p>
            <p className="text-small text-default-500">Select teams to analyze</p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
            <div className="md:col-span-3">
              <Select 
                label="Home Team" 
                selectedKeys={[homeTeam]} 
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0];
                  if (typeof selected === "string") {
                    setHomeTeam(selected);
                    setHasPrediction(false);
                  }
                }}
              >
                {teams.map((team) => (
                  <SelectItem key={team.value} value={team.value}>
                    {team.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
            
            <div className="flex justify-center items-center">
              <span className="text-default-500 font-semibold">VS</span>
            </div>
            
            <div className="md:col-span-3">
              <Select 
                label="Away Team" 
                selectedKeys={[awayTeam]} 
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0];
                  if (typeof selected === "string") {
                    setAwayTeam(selected);
                    setHasPrediction(false);
                  }
                }}
              >
                {teams.map((team) => (
                  <SelectItem key={team.value} value={team.value}>
                    {team.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
            
            <div className="md:col-span-7 flex justify-center mt-2">
              <Button 
                color="primary" 
                size="lg"
                onPress={handlePredict}
                isLoading={isPredicting}
                startContent={!isPredicting && <Icon icon="lucide:zap" />}
                className="w-full md:w-auto"
              >
                Generate Prediction
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {hasPrediction && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md font-semibold">Prediction Summary</p>
                <p className="text-small text-default-500">
                  {teams.find(t => t.value === homeTeam)?.label} vs {teams.find(t => t.value === awayTeam)?.label}
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center justify-center">
                  <div className="text-xl font-semibold mb-2">Match Outcome</div>
                  <div className="flex flex-col w-full gap-2">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-small">Home Win</span>
                        <span className="text-small">42%</span>
                      </div>
                      <Progress value={42} color="success" aria-label="Home Win" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-small">Draw</span>
                        <span className="text-small">28%</span>
                      </div>
                      <Progress value={28} color="warning" aria-label="Draw" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-small">Away Win</span>
                        <span className="text-small">30%</span>
                      </div>
                      <Progress value={30} color="danger" aria-label="Away Win" />
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <div className="text-xl font-semibold mb-2">Goals</div>
                  <div className="flex flex-col w-full gap-2">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-small">Over 2.5</span>
                        <span className="text-small">54%</span>
                      </div>
                      <Progress value={54} color="primary" aria-label="Over 2.5" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-small">Under 2.5</span>
                        <span className="text-small">46%</span>
                      </div>
                      <Progress value={46} color="secondary" aria-label="Under 2.5" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-small">BTTS</span>
                        <span className="text-small">69%</span>
                      </div>
                      <Progress value={69} color="success" aria-label="BTTS" />
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <div className="text-xl font-semibold mb-2">Model Confidence</div>
                  <div className="flex flex-col w-full gap-4">
                    <div className="flex items-center justify-center">
                      <div className="relative w-32 h-32">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold">79%</span>
                        </div>
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="hsl(var(--heroui-default-200))"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="hsl(var(--heroui-primary))"
                            strokeWidth="3"
                            strokeDasharray="79, 100"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="text-center text-default-500 text-small">
                      Based on 1,248 similar matches
                    </div>
                  </div>
                </div>
              </div>
              
              <Divider className="my-6" />
              
              <div className="flex flex-col">
                <div className="text-xl font-semibold mb-4">Recommended Bets</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-success-50 border border-success-200">
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">BTTS - Yes</div>
                          <div className="text-success text-small">Expected ROI: +12.4%</div>
                        </div>
                        <div className="text-xl font-bold">1.80</div>
                      </div>
                    </CardBody>
                  </Card>
                  
                  <Card className="bg-success-50 border border-success-200">
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">Over 2.5 Goals</div>
                          <div className="text-success text-small">Expected ROI: +8.2%</div>
                        </div>
                        <div className="text-xl font-bold">1.90</div>
                      </div>
                    </CardBody>
                  </Card>
                  
                  <Card className="bg-warning-50 border border-warning-200">
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">Home Win</div>
                          <div className="text-warning text-small">Expected ROI: +3.6%</div>
                        </div>
                        <div className="text-xl font-bold">2.10</div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Tabs 
            aria-label="Prediction Details" 
            selectedKey={selectedTab} 
            onSelectionChange={(key) => setSelectedTab(key.toString())}
          >
            <Tab 
              key="results" 
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:list" />
                  <span>Results</span>
                </div>
              }
            >
              <div className="mt-4">
                <Card>
                  <CardBody>
                    <div className="text-center text-default-500">
                      Detailed prediction results would be displayed here
                    </div>
                  </CardBody>
                </Card>
              </div>
            </Tab>
            
            <Tab 
              key="advanced" 
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:bar-chart" />
                  <span>Advanced Analytics</span>
                </div>
              }
            >
              <div className="mt-4">
                <Card>
                  <CardBody>
                    <div className="text-center text-default-500">
                      Advanced analytics and visualizations would be displayed here
                    </div>
                  </CardBody>
                </Card>
              </div>
            </Tab>
            
            <Tab 
              key="risk" 
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:shield" />
                  <span>Risk Management</span>
                </div>
              }
            >
              <div className="mt-4">
                <Card>
                  <CardBody>
                    <div className="text-center text-default-500">
                      Risk management analysis would be displayed here
                    </div>
                  </CardBody>
                </Card>
              </div>
            </Tab>
          </Tabs>
        </div>
      )}
    </div>
  );
};