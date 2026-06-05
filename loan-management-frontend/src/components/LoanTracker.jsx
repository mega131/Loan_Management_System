import React, { useEffect, useState } from "react";
import api from "../services/api";

const steps = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "DISBURSED",
  "ACTIVE",
  "COMPLETED",
];

const LoanTracker = ({ loanId }) => {

  const [currentStatus, setCurrentStatus] =
    useState("SUBMITTED");

  useEffect(() => {

    const fetchStatus = async () => {
      try {

        const res = await api.get(
          `/loans/${loanId}/status`
        );

        setCurrentStatus(res.data.status);

      } catch (error) {
        console.log(error);
      }
    };

    fetchStatus();

  }, [loanId]);

  const currentStep =
    steps.indexOf(currentStatus);

  return (
    <div className="p-6 bg-gray-800 rounded-2xl shadow-lg text-white">

      <h2 className="text-2xl font-bold mb-6">
        Loan Application Tracking
      </h2>

      <div className="flex justify-between items-center">

        {steps.map((step, index) => (

          <div
            key={index}
            className="flex flex-col items-center flex-1"
          >

            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-300
                ${
                  index <= currentStep
                    ? "bg-green-500"
                    : "bg-gray-600"
                }
              `}
            >
              {index <= currentStep ? "✔" : index + 1}
            </div>

            <p className="mt-2 text-xs text-center">
              {step.replace("_", " ")}
            </p>

            {index !== steps.length - 1 && (
              <div
                className={`
                  h-1 w-full mt-4
                  ${
                    index < currentStep
                      ? "bg-green-500"
                      : "bg-gray-600"
                  }
                `}
              />
            )}

          </div>
        ))}

      </div>

    </div>
  );
};

export default LoanTracker;