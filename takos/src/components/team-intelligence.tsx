import React from "react";
import { Card, CardBody, CardHeader, Select, SelectItem, Tabs, Tab } from "@heroui/react";
import { Icon } from "@iconify/react";
import { TeamFormChart } from "./charts/team-form-chart";
import { TeamStatsTable } from "./tables/team-stats-table";
import { HeadToHeadChart } from "./charts/head-to-head-chart";
import { fetchTeamStats } from "../lib/supabase";

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

export const TeamIntelligence = () => {
  const [selectedTeam, setSelectedTeam] = React.useState("arsenal");
  const [selectedTab, setSelectedTab] = React.useState("overview");
  const [teamStats, setTeamStats] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    loadTeamStats();
  }, [selectedTeam]);

  const loadTeamStats = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, we would fetch team stats from the database
      // For this example, we'll simulate the process
      const teamId = teams.findIndex(t => t.value === selectedTeam) + 1;
      const stats = await fetchTeamStats(teamId);
      setTeamStats(stats);
    } catch (error) {
      console.error("Error loading team stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold">Team Intelligence</h2>
          <p className="text-default-500">Analyze team performance and prediction models</p>
        </div>
        
        <div className="w-full md:w-64">
          <Select 
            label="Select Team" 
            selectedKeys={[selectedTeam]} 
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              if (typeof selected === "string") {
                setSelectedTeam(selected);
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
      </div>

      <Tabs 
        aria-label="Team Intelligence Options" 
        selectedKey={selectedTab} 
        onSelectionChange={(key) => setSelectedTab(key.toString())}
      >
        <Tab 
          key="overview" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:layout" />
              <span>Overview</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">Team Form</p>
                  <p className="text-small text-default-500">Last 10 matches</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="h-64">
                  <TeamFormChart teamId={selectedTeam} />
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">Team Statistics</p>
                  <p className="text-small text-default-500">Season 2023/2024</p>
                </div>
              </CardHeader>
              <CardBody>
                <TeamStatsTable teamId={selectedTeam} />
              </CardBody>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">Head-to-Head Analysis</p>
                  <p className="text-small text-default-500">Against top teams</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="h-80">
                  <HeadToHeadChart teamId={selectedTeam} />
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
        
        <Tab 
          key="model" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:cpu" />
              <span>Model Analysis</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">Model Performance</p>
                  <p className="text-small text-default-500">Accuracy by market</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="h-64">
                  {/* Team-specific model performance chart would go here */}
                  <div className="flex items-center justify-center h-full text-default-500">
                    Team-specific model performance visualization
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">Feature Importance</p>
                  <p className="text-small text-default-500">Key predictive factors</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="h-64">
                  {/* Feature importance visualization would go here */}
                  <div className="flex items-center justify-center h-full text-default-500">
                    Feature importance visualization
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
        
        <Tab 
          key="predictions" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:trending-up" />
              <span>Predictions</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-6 mt-4">
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">Upcoming Matches</p>
                  <p className="text-small text-default-500">Next 5 fixtures</p>
                </div>
              </CardHeader>
              <CardBody>
                {/* Upcoming matches predictions would go here */}
                <div className="flex items-center justify-center h-64 text-default-500">
                  Upcoming matches predictions visualization
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};