import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function PaymentSuccess() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 text-center gap-6">
      <CheckCircle className="h-16 w-16 text-primary" />
      <h1 className="text-2xl font-bold">Welcome to Premium! 🎉</h1>
      <p className="text-muted-foreground max-w-md">
        Your payment was successful. You now have lifetime access to all premium features.
      </p>
      <Button asChild size="lg">
        <Link to="/explore">Start Exploring</Link>
      </Button>
    </div>
  );
}
