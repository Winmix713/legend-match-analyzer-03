import React from "react";
import { Card, CardBody } from "@heroui/react";

interface StatCardProps {
  title: string;
  value: string;
  valueClassName?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, valueClassName = "" }) => {
  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex flex-col">
          <p className="text-small text-default-500">{title}</p>
          <p className={`text-2xl font-bold ${valueClassName}`}>{value}</p>
        </div>
      </CardBody>
    </Card>
  );
};
