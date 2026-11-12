import type { Metadata } from "next";
import { repoUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Lab notebook",
  description: "Every number measured in the tutorial's repository, with the conditions it was measured under.",
  alternates: { canonical: "/lab" },
};

export default function LabPage() {
  return (
    <main id="main" tabIndex={-1} className="page-frame pb-8 outline-none">
      <div className="max-w-[680px] pt-10 lg:pt-14">
        <h1 className="text-[2rem] leading-9 font-semibold stretch-90 sm:text-44 sm:leading-[3rem]">Lab notebook</h1>
        <p className="mt-4 font-serif text-20 leading-[1.875rem] text-ink-muted">
          Every number in the chapters was measured in the tutorial&rsquo;s repository and is written down in one
          file. This page will present that file as sortable tables and charts: closed-loop success rates on
          layouts the policy never saw, where the gripper closed, grasp tolerance, and training throughput.
          Until it is built, read the notebook{" "}
          <a href={repoUrl("tutorial/lab-notebook.md")} className="text-link">
            in the repository
          </a>
          .
        </p>
      </div>
    </main>
  );
}
