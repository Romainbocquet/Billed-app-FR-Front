/**
 * @jest-environment jsdom
 */
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore  from "../__mocks__/store";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import router from "../app/Router.js";
import { sortBillsByDate } from "../containers/Bills.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
    });

    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      const windowIcon = await waitFor(() => screen.getByTestId("icon-window"));
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("Then, If there is at least one bill then the array exists", async () => {
      onNavigate(ROUTES_PATH.Bills);
      const tbody = await waitFor(() => screen.getAllByTestId("tbody"));
      expect(tbody.length).toBeGreaterThan(0);
    });      
  })
})

describe('sortBillsByDate', () => {
  it('should sort bills in descending order by date', () => {
    const bills = [
      { date: '2023-08-15', amount: 100 },
      { date: '2023-08-10', amount: 200 },
      { date: '2023-08-20', amount: 150 },
    ];

    const sortedBills = sortBillsByDate(bills);

    expect(sortedBills).toEqual([
      { date: '2023-08-20', amount: 150 },
      { date: '2023-08-15', amount: 100 },
      { date: '2023-08-10', amount: 200 },
    ]);
  });

  it('should not modify the original bills array', () => {
    const bills = [
      { date: '2023-08-15', amount: 100 },
      { date: '2023-08-10', amount: 200 },
      { date: '2023-08-20', amount: 150 },
    ];
    const originalBills = bills.slice();

    sortBillsByDate(bills);

    expect(bills).toEqual(originalBills);
  });
});

describe("When I click the New Bill button on Bills Page", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
  });

  test("Then it should redirect to New Bill Page", async () => {
    window.onNavigate(ROUTES_PATH.Bills);
    const newBillBtn = await waitFor(() =>
      screen.getByTestId("btn-new-bill")
    );
    userEvent.click(newBillBtn);
  
    // Vérification de la redirection vers la page NewBill
    expect(window.location.hash).toBe(ROUTES_PATH.NewBill);
  });
});

describe("When I click the eye icon of a bill", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
  });

  test("Then a modal with a picture and a header text should be displayed", async () => {
    window.onNavigate(ROUTES_PATH.Bills);
    $.fn.modal = jest.fn();
    const eyeIcons = await waitFor(() => screen.getAllByTestId("icon-eye"));
    const lastEyeIcon = eyeIcons.reverse()[0];
    userEvent.click(lastEyeIcon);
    const headerText = await waitFor(() => screen.getByText("Justificatif"));
    const modalImage = await waitFor(() =>document.querySelector("img"));
    expect(headerText).toBeTruthy();
    expect(modalImage).not.toBeNull();
  });
});