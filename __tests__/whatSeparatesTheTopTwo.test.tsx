/**
 * @vitest-environment jsdom
 */
/**
 * The panel that answers "why is this one ahead of that one".
 *
 * A reader asked on 2026-09-01 for the complete analysis to be more clear-cut
 * between the parties. Measured the same day, the score cannot deliver that:
 * it is a mean over statements, so answering 35 instead of 15 narrows its
 * interval without widening the gap between the first and the second (5.3 to
 * 5.6 points on 300 seeded coherent respondents). What does grow with the long
 * run is the number of statements on which the top two genuinely diverge:
 * measured 2.3 to 3.8 in France, 2.2 to 4.4 in Belgium.
 *
 * So the panel shows those statements, and it must stay honest in the case the
 * same measurement found in 50 of 300 French complete runs: two parties this
 * corpus cannot separate at all.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import WhatSeparatesTheTopTwo from "@/components/test/results/WhatSeparatesTheTopTwo";
import { PARTIES_BY_ID } from "@/data/parties";
import { PARTY_POSITIONS } from "@/data/partyPositions";
import { statementsFor } from "@/lib/electoralScope";
import { separateParties } from "@/lib/partySeparation";
import type { AnswerRecord, LikertValue } from "@/types/positions";

const LFI = PARTIES_BY_ID["fr_lfi"];
const RN = PARTIES_BY_ID["fr_rn"];
const ECOLO = PARTIES_BY_ID["be_ecolo"];
const GROEN = PARTIES_BY_ID["be_groen"];

function answeringLike(partyId: string, country: "FR" | "BE"): AnswerRecord {
    const answers: AnswerRecord = {};
    for (const statement of statementsFor(country)) {
        const coded = PARTY_POSITIONS[statement.id]?.[partyId];
        if (coded !== undefined) answers[statement.id] = coded.value;
    }
    return answers;
}

describe("what separates the top two", () => {
    it("names both parties", () => {
        const answers = answeringLike(LFI.id, "FR");
        render(<WhatSeparatesTheTopTwo separation={separateParties(LFI, RN, answers, "FR")} />);

        expect(screen.getByRole("heading").textContent).toContain(LFI.name);
        expect(screen.getByRole("heading").textContent).toContain(RN.name);
    });

    it("says how the reader split over the statements that divide them", () => {
        const answers = answeringLike(LFI.id, "FR");
        const separation = separateParties(LFI, RN, answers, "FR");
        render(<WhatSeparatesTheTopTwo separation={separation} />);

        const text = document.body.textContent ?? "";
        expect(text).toContain(`${separation.firstCount} fois`);
        expect(text).toContain(`${separation.separating.length} énoncés`);
    });

    it("shows the statement text and both party positions for each divergence", () => {
        const answers = answeringLike(LFI.id, "FR");
        const separation = separateParties(LFI, RN, answers, "FR");
        render(<WhatSeparatesTheTopTwo separation={separation} />);

        const first = separation.separating[0];
        expect(screen.getByText(first.statement.text)).toBeTruthy();
        const text = document.body.textContent ?? "";
        expect(text).toContain("Vous");
    });

    it("caps the list and says how many divergences it did not draw", () => {
        const answers = answeringLike(LFI.id, "FR");
        const separation = separateParties(LFI, RN, answers, "FR");
        render(<WhatSeparatesTheTopTwo separation={separation} />);

        // The measured maximum is 15 for France, which is a scroll of statement
        // cards on a 375px screen, so the panel shows a readable head of the
        // list and counts the rest rather than hiding it.
        const drawn = separation.separating.filter((entry) =>
            screen.queryByText(entry.statement.text)
        );
        expect(drawn.length).toBeLessThanOrEqual(6);
        if (separation.separating.length > drawn.length) {
            expect(document.body.textContent).toContain(
                `${separation.separating.length - drawn.length} autres`
            );
        }
    });

    it("states plainly that the corpus cannot separate two identically coded parties", () => {
        const answers = answeringLike(ECOLO.id, "BE");
        const separation = separateParties(ECOLO, GROEN, answers, "BE");
        render(<WhatSeparatesTheTopTwo separation={separation} />);

        expect(separation.separating).toHaveLength(0);
        const text = document.body.textContent ?? "";
        expect(text).toContain("aucun énoncé");
        expect(text).toContain(`${separation.comparable}`);
    });

    it("draws nothing at all when the reader answered nothing", () => {
        const { container } = render(
            <WhatSeparatesTheTopTwo separation={separateParties(LFI, RN, {}, "FR")} />
        );

        expect(container.firstChild).toBeNull();
    });

    it("never claims a divergence the coded table does not carry", () => {
        const answers: AnswerRecord = Object.fromEntries(
            statementsFor("FR").map((s) => [s.id, 0 as LikertValue])
        );
        const separation = separateParties(LFI, RN, answers, "FR");
        render(<WhatSeparatesTheTopTwo separation={separation} />);

        for (const entry of separation.separating.slice(0, 6)) {
            const stated = PARTY_POSITIONS[entry.statement.id];
            expect(stated[LFI.id].value).toBe(entry.firstPosition);
            expect(stated[RN.id].value).toBe(entry.secondPosition);
        }
    });
});
