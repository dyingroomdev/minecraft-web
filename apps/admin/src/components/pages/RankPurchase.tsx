import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { z } from 'zod';

import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  mc_username: z.string().min(3).max(16),
  bkash_txid: z.string().min(8).max(64),
  amount_bdt: z.string().min(1),
  screenshot_url: z.string().url().optional().or(z.literal('')), 
});

export function RankPurchase() {
  const { code } = useParams<{ code: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [formState, setFormState] = useState({
    mc_username: '',
    bkash_txid: '',
    amount_bdt: '',
    screenshot_url: '',
  });
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: ranks, isLoading } = useQuery({
    queryKey: ['rank-products'],
    queryFn: () => apiClient.getRankProducts(),
  });

  const rankProduct = useMemo(
    () => ranks?.find((rank) => rank.rank_code.toLowerCase() === code?.toLowerCase()),
    [ranks, code]
  );

  const submitMutation = useMutation({
    mutationFn: (payload: z.infer<typeof formSchema>) =>
      apiClient.submitPayment({
        rank_code: rankProduct!.rank_code,
        mc_username: payload.mc_username,
        bkash_txid: payload.bkash_txid,
        amount_bdt: payload.amount_bdt,
        screenshot_url: payload.screenshot_url || undefined,
      }),
    onSuccess: (payment) => {
      setSubmissionId(payment.id);
      setCurrentStep(2);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Payment submission failed';
      setError(message);
    },
  });

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 2));
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      const payload = formSchema.parse(formState);
      if (!rankProduct) {
        throw new Error('Rank unavailable');
      }
      submitMutation.mutate(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid input';
      setError(message);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-10">Loading rank information…</div>;
  }

  if (!rankProduct) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <p className="text-destructive mb-4">This rank is currently unavailable.</p>
        <Button variant="outline" asChild>
          <Link to="/ranks">Back to ranks</Link>
        </Button>
      </div>
    );
  }

  const steps = ['Prepare Payment', 'Submit Details', 'Confirmation'];

  return (
    <section className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
      <header className="space-y-2 text-center">
        <Badge variant="secondary" className="mx-auto w-fit">
          {rankProduct.rank_code.toUpperCase()}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">Purchase {rankProduct.display_name}</h1>
        <p className="text-muted-foreground">
          Complete the steps below to acquire your rank. Payments are processed manually within a few minutes.
        </p>
      </header>

      <div className="flex justify-center gap-4">
        {steps.map((label, index) => (
          <div key={label} className="flex flex-col items-center text-sm">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full border ${index <= currentStep ? 'bg-lime-500 text-forest-900' : 'bg-muted text-muted-foreground'}`}>
              {index + 1}
            </span>
            <span className="mt-2 font-medium text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>1. Send bKash Payment</CardTitle>
            <CardDescription>
              Send ৳{rankProduct.price_bdt} to bKash merchant <strong>01700-000000</strong>. Include your Minecraft username in the reference.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Ensure the transaction amount matches the rank price (±5% tolerance).</li>
              <li>Keep the transaction ID and optional screenshot handy for the next step.</li>
              <li>Payments are verified manually by staff.</li>
            </ul>
            <div className="flex justify-end">
              <Button onClick={handleNext}>I have paid</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>2. Submit Transaction Details</CardTitle>
            <CardDescription>
              Provide the transaction reference so our staff can verify your purchase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="mc_username">Minecraft Username</Label>
                <Input
                  id="mc_username"
                  name="mc_username"
                  value={formState.mc_username}
                  onChange={(event) => setFormState((prev) => ({ ...prev, mc_username: event.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="bkash_txid">bKash Transaction ID</Label>
                <Input
                  id="bkash_txid"
                  name="bkash_txid"
                  value={formState.bkash_txid}
                  onChange={(event) => setFormState((prev) => ({ ...prev, bkash_txid: event.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount_bdt">Amount Paid (BDT)</Label>
                <Input
                  id="amount_bdt"
                  name="amount_bdt"
                  type="number"
                  value={formState.amount_bdt}
                  onChange={(event) => setFormState((prev) => ({ ...prev, amount_bdt: event.target.value }))}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="screenshot_url">Screenshot URL (optional)</Label>
                <Textarea
                  id="screenshot_url"
                  name="screenshot_url"
                  placeholder="https://..."
                  value={formState.screenshot_url}
                  onChange={(event) => setFormState((prev) => ({ ...prev, screenshot_url: event.target.value }))}
                />
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <div className="flex justify-between">
                <Button type="button" variant="ghost" onClick={handleBack}>
                  Back
                </Button>
                <Button type="submit" disabled={submitMutation.isLoading}>
                  {submitMutation.isLoading ? 'Submitting…' : 'Submit for review'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && submissionId && (
        <Card>
          <CardHeader>
            <CardTitle>3. Confirmation</CardTitle>
            <CardDescription>
              Your payment request has been received. Staff will review it shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Track the status of your purchase at any time:
            </p>
            <Button asChild>
              <Link to={`/purchase/${submissionId}`}>View purchase status</Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              You can close this page. A Discord notification will be sent once your rank is active.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
