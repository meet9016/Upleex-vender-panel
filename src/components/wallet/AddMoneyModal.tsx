"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { CheckCircleIcon, AlertIcon } from "@/icons";
import { useWallet } from "@/context/WalletContext";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMoney?: (amount: number) => Promise<void>;
}

type ModalStep = "amount" | "payment" | "success";

const AddMoneyModal: React.FC<AddMoneyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { refreshBalance } = useWallet();
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<ModalStep>("amount");
  const [transactionId, setTransactionId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setError("");
      setCurrentStep("amount");
      setTransactionId("");
      setIsLoading(false);
    }
  }, [isOpen]);

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount < 50) {
      setError("Minimum amount is ₹50");
      return;
    }

    setCurrentStep("payment");
  };

  const handleRazorpayPayment = async () => {
    setIsLoading(true);
    setError("");

    try {
      const numAmount = parseFloat(amount);

      // Create Razorpay order
      const orderResponse = await api.post(endPointApi.addWalletMoney, {
        amount: numAmount,
      });

      if (!orderResponse.data.success) {
        throw new Error(
          orderResponse.data.message || "Failed to create order"
        );
      }

      const { transaction_id, razorpay_order_id, key } =
        orderResponse.data.data;

      // Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        const options = {
          key: key,
          amount: numAmount * 100,
          currency: "INR",
          name: "Upleex",
          description: `Add ₹${numAmount} to wallet`,
          order_id: razorpay_order_id,
          handler: async function (response: any) {
            try {
              const verifyResponse = await api.post(
                endPointApi.verifyWalletPayment,
                {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  transaction_id: transaction_id,
                }
              );

              if (verifyResponse.data.success) {
                setTransactionId(transaction_id);
                await refreshBalance();
                // Dispatch event to notify all listeners about wallet update
                window.dispatchEvent(new Event('walletUpdated'));
                setCurrentStep("success");
              } else {
                throw new Error("Payment verification failed");
              }
            } catch (error: any) {
              setError(
                error.message || "Payment verification failed. Please contact support."
              );
              setCurrentStep("amount");
            } finally {
              setIsLoading(false);
            }
          },
          prefill: {
            name: "Vendor",
            email: "vendor@example.com",
            contact: "9999999999",
          },
          theme: {
            color: "#3B82F6",
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
              setError("Payment cancelled");
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    } catch (error: any) {
      setError(error.message || "Failed to initiate payment");
      setIsLoading(false);
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
    setError("");
  };

  const handleClose = () => {
    setAmount("");
    setError("");
    setCurrentStep("amount");
    setTransactionId("");
    onClose();
  };

  const renderStepIndicator = () => {
    const steps = ["Amount", "Payment", "Success"];
    const stepKeys = ["amount", "payment", "success"];
    const currentIndex = stepKeys.indexOf(currentStep);
    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((step, i) => (
          <React.Fragment key={step}>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  i < currentIndex
                    ? "bg-brand-500 text-white"
                    : i === currentIndex
                    ? "bg-brand-500 text-white ring-4 ring-brand-100 dark:ring-brand-900/30"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
                }`}
              >
                {i < currentIndex ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  i === currentIndex
                    ? "text-gray-800 dark:text-white/90"
                    : "text-gray-400 dark:text-gray-600"
                }`}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 w-8 transition-colors ${
                  i < currentIndex
                    ? "bg-brand-500"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderAmountStep = () => (
    <div>
      {renderStepIndicator()}
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
        Add Money to Wallet
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Enter the amount you wish to add
      </p>

      <form onSubmit={(e) => { e.preventDefault(); handleAmountSubmit(e); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Enter Amount
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium select-none">
              ₹
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              placeholder="50"
              min="50"
              className="w-full pl-8 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-800 dark:text-white/90 placeholder-gray-400"
              required
            />
          </div>
          {error && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Quick Select
          </label>
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => handleQuickAmount(quickAmount)}
                className={`px-3 py-2 text-sm font-medium border rounded-lg transition-all duration-150 ${
                  amount === quickAmount.toString()
                    ? "bg-brand-500 text-white border-brand-500 shadow-sm"
                    : "bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/10"
                }`}
              >
                ₹{quickAmount}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
          <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-0.5">
            <li>• Minimum: ₹50</li>
            <li>• Processing time: Instant</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleAmountSubmit(new Event('submit') as any)}
            className=" btn-primary"
            disabled={!amount || parseFloat(amount) < 50}
          >
            Continue to Payment
          </Button>
        </div>
      </form>
    </div>
  );

  const renderPaymentStep = () => (
    <div>
      {renderStepIndicator()}
      <div className="space-y-5">
        {/* Amount Display */}
        <div className="text-center py-4 px-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/30">
          <p className="text-xs font-medium text-brand-600 dark:text-brand-400 mb-1">
            Amount to Pay
          </p>
          <div className="text-3xl font-bold text-brand-700 dark:text-brand-300">
            ₹{parseFloat(amount).toLocaleString("en-IN")}
          </div>
        </div>

        {/* Payment Info */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
          <AlertIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <p className="font-semibold mb-0.5">Secure Payment</p>
            <p>
              You will be redirected to Razorpay to complete the payment. Money is added to your wallet instantly after successful payment.
            </p>
          </div>
        </div>

        {/* Payment Methods Info */}
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Accepted Payment Methods:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div>• UPI (GPay, PhonePe)</div>
            <div>• Debit/Credit Card</div>
            <div>• Net Banking</div>
            <div>• Digital Wallets</div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
            <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentStep("amount")}
            className="flex-1"
            disabled={isLoading}
          >
            Back
          </Button>
          <Button
            onClick={handleRazorpayPayment}
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : (
              `Pay ₹${parseFloat(amount).toLocaleString("en-IN")}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center">
      {renderStepIndicator()}
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 dark:bg-green-900/20">
        <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
        Money Added Successfully!
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        ₹{parseFloat(amount).toLocaleString("en-IN")} has been added to your
        wallet
      </p>
      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 mb-5">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Transaction ID:{" "}
          <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
            {transactionId}
          </span>
        </p>
      </div>
      <Button onClick={handleClose} className="w-full">
        Done
      </Button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "amount":
        return renderAmountStep();
      case "payment":
        return renderPaymentStep();
      case "success":
        return renderSuccessStep();
      default:
        return renderAmountStep();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={currentStep === "payment" ? () => {} : handleClose}
      className="max-w-md mx-4"
      showCloseButton={currentStep !== "payment"}
    >
      <div className="m-10">{renderCurrentStep()}</div>
    </Modal>
  );
};

export default AddMoneyModal;
