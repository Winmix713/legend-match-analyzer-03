import React from "react";
import { Tabs, Tab, Navbar, NavbarBrand, NavbarContent, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Dashboard } from "./components/dashboard";
import { TeamIntelligence } from "./components/team-intelligence";
import { MatchPrediction } from "./components/match-prediction";
import { SeasonSimulator } from "./components/season-simulator";
import { ModelManagement } from "./components/model-management";
import { AdvancedAnalytics } from "./components/advanced-analytics";
import { ResultsFeedback } from "./components/results-feedback";

export default function App() {
  const [selected, setSelected] = React.useState("dashboard");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar isBordered>
        <NavbarBrand>
          <div className="flex items-center gap-2">
            <Icon icon="lucide:activity" className="text-primary text-xl" />
            <p className="font-semibold text-inherit">Football Prediction System</p>
          </div>
        </NavbarBrand>
        <NavbarContent justify="end">
          <Dropdown>
            <DropdownTrigger>
              <Button 
                variant="light" 
                startContent={<Icon icon="lucide:settings" />}
              >
                Settings
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Settings Actions">
              <DropdownItem key="profile" startContent={<Icon icon="lucide:user" />}>Profile</DropdownItem>
              <DropdownItem key="system" startContent={<Icon icon="lucide:cpu" />}>System</DropdownItem>
              <DropdownItem key="help" startContent={<Icon icon="lucide:help-circle" />}>Help & Feedback</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarContent>
      </Navbar>
      
      <div className="flex flex-col flex-grow p-4">
        <Tabs 
          aria-label="Options" 
          selectedKey={selected} 
          onSelectionChange={setSelected}
          className="mb-4"
        >
          <Tab 
            key="dashboard" 
            title={
              <div className="flex items-center gap-2">
                <Icon icon="lucide:layout-dashboard" />
                <span>Dashboard</span>
              </div>
            }
          >
            <Dashboard />
          </Tab>
          <Tab 
            key="team-intelligence" 
            title={
              <div className="flex items-center gap-2">
                <Icon icon="lucide:shield" />
                <span>Team Intelligence</span>
              </div>
            }
          >
            <TeamIntelligence />
          </Tab>
          <Tab 
            key="match-prediction" 
            title={
              <div className="flex items-center gap-2">
                <Icon icon="lucide:target" />
                <span>Match Prediction</span>
              </div>
            }
          >
            <MatchPrediction />
          </Tab>
          <Tab 
            key="season-simulator" 
            title={
              <div className="flex items-center gap-2">
                <Icon icon="lucide:calendar" />
                <span>Season Simulator</span>
              </div>
            }
          >
            <SeasonSimulator />
          </Tab>
          <Tab 
            key="model-management" 
            title={
              <div className="flex items-center gap-2">
                <Icon icon="lucide:layers" />
                <span>Model Management</span>
              </div>
            }
          >
            <ModelManagement />
          </Tab>
          <Tab 
            key="advanced-analytics" 
            title={
              <div className="flex items-center gap-2">
                <Icon icon="lucide:bar-chart-2" />
                <span>Advanced Analytics</span>
              </div>
            }
          >
            <AdvancedAnalytics />
          </Tab>
          
          <Tab 
            key="results-feedback" 
            title={
              <div className="flex items-center gap-2">
                <Icon icon="lucide:check-circle" />
                <span>Results Feedback</span>
              </div>
            }
          >
            <ResultsFeedback />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}