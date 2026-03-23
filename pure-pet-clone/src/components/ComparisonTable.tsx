"use client";

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 48 48">
    <g fillRule="evenodd" clipPath="url(#a)" clipRule="evenodd">
      <path fill="#95A24D" d="M4.675 30.046C1.419 17.889 10.065 6.335 21.898 4.154a15.4 15.4 0 0 1 5.408-.03C39.883 6.32 46.67 19.427 43.044 31.341c-.716 2.356-1.905 4.57-3.576 6.38-3.046 3.297-7.263 5.508-11.696 6.145-7.022 1.088-14.221-1.676-19.067-6.746-1.889-1.977-3.295-4.396-4.018-7.032z" />
      <path fill="#fff" d="M11.87 27.07c.573-.95 1.232-1.671 1.979-2.18.747-.508.92-.098 1.58.986.336.548.523 1.006 1.185 2.024.482.742 1.087 1.66 1.637 1.412.176-.08.33-.258.48-.434l11.885-13.95c.735-.862 1.49-1.74 2.36-2.12.868-.379.587-.662 2.505.931 1.699 1.411.766 1.476.2 2.086-.195.209-.312.401-.49.544-4.242 3.404-7.002 7.963-11.031 12.025-1.756 1.77-3.978 4.985-5.882 6.261-.733.49-1.55.985-2.288.528-.57-.351-.968-1.196-1.335-2.003q-1.394-3.056-2.786-6.11" />
    </g>
    <defs>
      <clipPath id="a"><path fill="#fff" d="M0 0h48v48H0z" /></clipPath>
    </defs>
  </svg>
);

const CrossIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 48 48">
    <g clipPath="url(#a)">
      <path fill="#BE0021" fillRule="evenodd" d="M31.274 44.778c13.59-4.817 18.271-21.278 11.02-33.334C32.236-1.852 12.585 1.103 4.741 15.124 2.227 20.7 2.475 27.379 5.17 32.828c3.886 8.075 12.656 13.115 21.536 12.983a20.5 20.5 0 0 0 4.568-1.033" clipRule="evenodd" />
      <path fill="#fff" d="M13.282 16.502c3.68 2.904 7.193 6.01 10.56 9.272 2.953 2.863 5.747 5.874 8.834 8.598.933.823 2.273 1.034 3.386.393.855-.492 1.575-1.866.645-2.688-3.16-2.788-6.013-5.875-9.042-8.798a149 149 0 0 0-11.18-9.778c-1.95-1.54-5.609 1.1-3.202 3z" />
      <path fill="#fff" d="M35.019 12.336c-3.787 2.927-7.247 6.172-10.782 9.386-1.877 1.707-3.854 3.436-5.741 4.82-2.32 1.7-4.735 3.322-6.738 5.405-.824.859-.74 2.163.25 2.857.99.693 2.59.584 3.44-.301 1.929-2.009 3.974-3.325 6.226-4.997 2.184-1.622 4.24-3.4 6.252-5.229 3.535-3.214 6.997-6.459 10.781-9.386.957-.74.638-2.234-.25-2.856-1.109-.776-2.45-.462-3.438.3" />
    </g>
    <defs>
      <clipPath id="a"><path fill="#fff" d="M0 0h48v48H0z" /></clipPath>
    </defs>
  </svg>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ComparisonTable({ content }: { content?: any }) {
  const heading = content?.heading ?? "How Pure compares";
  const col1Header = content?.col_1_header ?? "PURE";
  const col2Header = content?.col_2_header ?? "Dry & wet";
  const col3Header = content?.col_3_header ?? "Raw & fresh";

  const rows = [
    {
      label: content?.row_1_label ?? "Cost",
      pure: content?.row_1_pure ?? "££",
      dry: content?.row_1_dry ?? "£",
      raw: content?.row_1_raw ?? "£££",
    },
    {
      label: content?.row_2_label ?? "No/low processing",
      pure: content?.row_2_pure ?? true,
      dry: content?.row_2_dry ?? false,
      raw: content?.row_2_raw ?? true,
    },
    {
      label: content?.row_3_label ?? "High quality ingredients",
      pure: content?.row_3_pure ?? true,
      dry: content?.row_3_dry ?? false,
      raw: content?.row_3_raw ?? true,
    },
    {
      label: content?.row_4_label ?? "Easy to store",
      pure: content?.row_4_pure ?? true,
      dry: content?.row_4_dry ?? true,
      raw: content?.row_4_raw ?? false,
    },
    {
      label: content?.row_5_label ?? "No risk of harmful pathogens",
      pure: content?.row_5_pure ?? true,
      dry: content?.row_5_dry ?? true,
      raw: content?.row_5_raw ?? false,
    },
  ];

  return (
    <section className="bg-purple-brand py-16 pb-20 relative z-[1] overflow-hidden">
      {/* Decorative elements - right side */}
      <div className="absolute right-0 top-0 h-full pointer-events-none hidden md:block">
        <svg viewBox="0 0 180 500" className="absolute right-0 top-0 w-44 h-full">
          {/* Orange splash cluster */}
          <path d="M140 40 Q165 20 175 50 Q165 70 145 65 Q130 55 140 40Z" fill="#E65A1E" opacity="0.6" />
          <path d="M155 80 Q170 70 180 90 Q172 105 158 95 Q148 88 155 80Z" fill="#E65A1E" opacity="0.45" />
          {/* Green leaf shapes */}
          <ellipse cx="150" cy="200" rx="22" ry="48" fill="#274C46" opacity="0.35" transform="rotate(-15 150 200)" />
          <ellipse cx="135" cy="240" rx="18" ry="35" fill="#274C46" opacity="0.3" transform="rotate(20 135 240)" />
          {/* Yellow kibble */}
          <ellipse cx="160" cy="350" rx="13" ry="9" fill="#F2A900" opacity="0.5" transform="rotate(25 160 350)" />
          <ellipse cx="145" cy="380" rx="11" ry="7" fill="#F2A900" opacity="0.4" transform="rotate(-20 145 380)" />
        </svg>
      </div>
      {/* Decorative elements - left side */}
      <div className="absolute left-0 top-0 h-full pointer-events-none hidden md:block">
        <svg viewBox="0 0 120 500" className="absolute left-0 top-0 w-28 h-full">
          {/* Pink splash */}
          <path d="M-5 120 Q20 100 35 120 Q20 145 5 140 Q-10 135 -5 120Z" fill="#E88B7D" opacity="0.4" />
          {/* Orange shape */}
          <path d="M10 320 Q30 300 45 320 Q35 340 15 340 Q0 335 10 320Z" fill="#E65A1E" opacity="0.4" />
        </svg>
      </div>

      <div className="max-w-container mx-auto px-6">
        <h2 className="text-[36px] md:text-[40px] font-semibold text-white text-center font-rubik mb-10">
          {heading}
        </h2>

        <div className="max-w-[700px] mx-auto">
          {/* Header Row */}
          <div className="grid grid-cols-4 gap-0 bg-[#4F194A] rounded-t-xl overflow-hidden">
            <div className="p-4"></div>
            <div className="p-4 text-center text-white font-semibold text-[16px]">
              {col1Header}
            </div>
            <div className="p-4 text-center text-white font-semibold text-[16px] whitespace-pre-line">
              {col2Header}
            </div>
            <div className="p-4 text-center text-white font-semibold text-[16px] whitespace-pre-line">
              {col3Header}
            </div>
          </div>

          {/* Data Rows */}
          {rows.map((row, index) => (
            <div
              key={index}
              className={`grid grid-cols-4 gap-0 ${
                index % 2 === 0 ? "bg-[#5a2759]" : "bg-[#652b64]"
              } ${index === rows.length - 1 ? "rounded-b-xl" : ""}`}
            >
              <div className="p-4 flex items-center">
                <span className="text-white font-semibold text-[15px]">
                  {row.label}
                </span>
              </div>
              <div className="p-4 flex items-center justify-center">
                {typeof row.pure === "string" ? (
                  <span className="text-white font-semibold text-[18px]">{row.pure}</span>
                ) : row.pure ? (
                  <CheckIcon />
                ) : (
                  <CrossIcon />
                )}
              </div>
              <div className="p-4 flex items-center justify-center">
                {typeof row.dry === "string" ? (
                  <span className="text-white font-semibold text-[18px]">{row.dry}</span>
                ) : row.dry ? (
                  <CheckIcon />
                ) : (
                  <CrossIcon />
                )}
              </div>
              <div className="p-4 flex items-center justify-center">
                {typeof row.raw === "string" ? (
                  <span className="text-white font-semibold text-[18px]">{row.raw}</span>
                ) : row.raw ? (
                  <CheckIcon />
                ) : (
                  <CrossIcon />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
