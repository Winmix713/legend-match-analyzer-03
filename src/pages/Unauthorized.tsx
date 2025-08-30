import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, Home, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <ShieldOff className="w-16 h-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">Access Denied</CardTitle>
          <CardDescription className="text-base">
            You don't have permission to access this page. Contact your administrator if you believe this is an error.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)} 
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};