import { Construction } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ComingSoon({ featureName }: { featureName: string }) {
  return (
    <Card className="w-full max-w-md mx-auto mt-10 shadow-lg">
      <CardHeader className="items-center">
        <Construction className="w-16 h-16 mb-4 text-primary" />
        <CardTitle className="text-2xl font-semibold font-headline">Coming Soon!</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground">
          The <span className="font-medium text-foreground">{featureName}</span> feature is currently under development.
        </p>
        <p className="text-muted-foreground mt-2">
          We're working hard to bring it to you. Please check back later!
        </p>
      </CardContent>
    </Card>
  );
}
