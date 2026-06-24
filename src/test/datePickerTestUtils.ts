import { screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

interface SelectDatePickerMonthYearOptions {
  fieldName: string;
  monthName: string;
  year: number;
}

export async function selectDatePickerMonthYear(
  user: UserEvent,
  { fieldName, monthName, year }: SelectDatePickerMonthYearOptions,
) {
  const dateField = screen.getByRole("group", { name: fieldName });

  await user.click(within(dateField).getByLabelText(/Choose date/));
  await user.click(await screen.findByRole("radio", { name: year.toString() }));
  await user.click(await screen.findByRole("radio", { name: monthName }));
}

