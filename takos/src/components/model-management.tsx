import React from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Badge, Tabs, Tab, Progress } from "@heroui/react";
import { Icon } from "@iconify/react";

// Mock model data
const modelData = [
  { id: 1, name: "Team-Specific: Arsenal", type: "LightGBM", accuracy: 76.2, lastTrained: "2023-10-15", status: "Active" },
  { id: 2, name: "Team-Specific: Chelsea", type: "RandomForest", accuracy: 72.8, lastTrained: "2023-10-14", status: "Active" },
  { id: 3, name: "Team-Specific: Liverpool", type: "LogisticRegression", accuracy: 74.5, lastTrained: "2023-10-12", status: "Active" },
  { id: 4, name: "Global: 1X2 Market", type: "XGBoost", accuracy: 68.9, lastTrained: "2023-10-10", status: "Active" },
  { id: 5, name: "Global: Over/Under", type: "NeuralNetwork", accuracy: 71.3, lastTrained: "2023-10-08", status: "Active" },
  { id: 6, name: "Global: BTTS", type: "RandomForest", accuracy: 73.1, lastTrained: "2023-10-05", status: "Active" },
  { id: 7, name: "Global: HT/FT", type: "XGBoost", accuracy: 65.7, lastTrained: "2023-10-01", status: "Active" },
  { id: 8, name: "Team-Specific: Manchester City", type: "LightGBM", accuracy: 78.4, lastTrained: "2023-09-28", status: "Active" },
];

export const ModelManagement = () => {
  const [selectedTab, setSelectedTab] = React.useState("models");
  const [isTraining, setIsTraining] = React.useState(false);
  const [teamModels, setTeamModels] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    loadTeamModels();
  }, []);

  const loadTeamModels = async () => {
    setIsLoading(true);
    try {
      const models = await fetchTeamModels();
      setTeamModels(models);
    } catch (error) {
      console.error("Error loading team models:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrainAll = () => {
    setIsTraining(true);
    // Simulate training delay
    setTimeout(() => {
      setIsTraining(false);
      loadTeamModels();
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Model Management</h2>
          <p className="text-default-500">Manage and monitor prediction models</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            color="primary" 
            startContent={<Icon icon="lucide:plus" />}
          >
            New Model
          </Button>
          <Button 
            color="secondary" 
            startContent={!isTraining && <Icon icon="lucide:refresh-cw" />}
            isLoading={isTraining}
            onPress={handleTrainAll}
          >
            Train All
          </Button>
        </div>
      </div>

      <Tabs 
        aria-label="Model Management Options" 
        selectedKey={selectedTab} 
        onSelectionChange={(key) => setSelectedTab(key.toString())}
      >
        <Tab 
          key="models" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:layers" />
              <span>Models</span>
            </div>
          }
        >
          <div className="mt-4">
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">Prediction Models</p>
                  <p className="text-small text-default-500">All active and inactive models</p>
                </div>
              </CardHeader>
              <CardBody>
                <Table 
                  removeWrapper 
                  aria-label="Prediction Models"
                  classNames={{
                    th: "bg-default-100"
                  }}
                >
                  <TableHeader>
                    <TableColumn>ID</TableColumn>
                    <TableColumn>Name</TableColumn>
                    <TableColumn>Type</TableColumn>
                    <TableColumn>Accuracy</TableColumn>
                    <TableColumn>Last Trained</TableColumn>
                    <TableColumn>Status</TableColumn>
                    <TableColumn>Actions</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {modelData.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell>{model.id}</TableCell>
                        <TableCell>{model.name}</TableCell>
                        <TableCell>{model.type}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={model.accuracy} 
                              color={model.accuracy > 75 ? "success" : model.accuracy > 70 ? "primary" : "warning"} 
                              size="sm" 
                              className="max-w-24" 
                            />
                            <span>{model.accuracy}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{model.lastTrained}</TableCell>
                        <TableCell>
                          <Badge color={model.status === "Active" ? "success" : "warning"}>
                            {model.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="flat" color="primary">
                              <Icon icon="lucide:edit" />
                            </Button>
                            <Button size="sm" variant="flat" color="success">
                              <Icon icon="lucide:refresh-cw" />
                            </Button>
                            <Button size="sm" variant="flat" color="danger">
                              <Icon icon="lucide:trash-2" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </div>
        </Tab>
        
        <Tab 
          key="performance" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:bar-chart-2" />
              <span>Performance</span>
            </div>
          }
        >
          <div className="mt-4">
            <Card>
              <CardBody>
                <div className="text-center text-default-500">
                  Model performance metrics and visualizations would be displayed here
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
        
        <Tab 
          key="training" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:settings" />
              <span>Training</span>
            </div>
          }
        >
          <div className="mt-4">
            <Card>
              <CardBody>
                <div className="text-center text-default-500">
                  Model training configuration and history would be displayed here
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};