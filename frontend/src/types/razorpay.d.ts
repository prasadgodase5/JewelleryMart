declare interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  method?: { upi?: boolean; card?: boolean; netbanking?: boolean; wallet?: boolean; emi?: boolean; paylater?: boolean };
  handler?: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void; escape?: boolean };
  notes?: Record<string, string>;
}

declare interface RazorpayInstance {
  open(): void;
  on(event: string, cb: (resp: any) => void): void;
}

declare interface Window {
  Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
}
