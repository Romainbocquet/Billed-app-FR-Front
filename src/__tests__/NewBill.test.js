/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import userEvent from "@testing-library/user-event";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { bills } from "../fixtures/bills.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  beforeAll(() => {
    // Simuler l'objet localStorage en utilisant l'implémentation localStorageMock.
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
  
    // Stocker un utilisateur simulé dans le localStorage.
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "e@e",
      })
    );
  
    // Créer un élément div simulé avec l'attribut id "root".
    const root = document.createElement("div");
    root.setAttribute("id", "root");
  
    // Ajouter l'élément div simulé au corps du document.
    document.body.append(root);
  
    // Appeler la fonction de routage pour configurer les routes (simulé pour les tests).
    router();
  
    // Simuler un changement de route vers la page NewBill.
    window.onNavigate(ROUTES_PATH.NewBill);
  
    // Remplacer la fonction d'alerte par une version simulée pour le suivi des appels.
    window.alert = jest.fn();
  });  

  describe("When I am on NewBill Page", () => {

    test("Then a header text should be displayed", () => {
      const headerText = screen.getByText("Envoyer une note de frais");
      expect(headerText).toBeTruthy();
    });

    test("Then a submit button should be displayed", () => {
      const submitBtn = document.getElementById("btn-send-bill");
      expect(submitBtn).toBeTruthy();
    });

    test("Then the new bill form should be displayed", () => {
      const newBillForm = screen.getByTestId("form-new-bill");
      expect(newBillForm).toBeTruthy();
    });
  })

  describe("When I upload a file with good format on newBill Page", () => {
    test("Then the file should be loaded", async () => {
      
      // On récupère l'élément de l'interface utilisateur (UI) avec l'attribut de test ID "file".
      const fileInput = screen.getByTestId("file");
      
      // On crée un objet "testFile" simulé de type File pour représenter le fichier que l'utilisateur télécharge.
      // Cet objet a le nom "test.png", un contenu bidon ("testFile"), et il est défini comme un fichier PNG.
      const testFile = new File(["testFile"], "test.png", {
        type: "image/png",
      });

      // On attend que l'action de téléchargement du fichier soit effectuée.
      // Cela est important car l'opération de téléchargement peut être asynchrone.
      await userEvent.upload(fileInput, testFile);

      // On vérifie si le fichier téléchargé est identique à celui que nous avons simulé.
      expect(fileInput.files.item(0)).toStrictEqual(testFile);
    });
  });

  describe("When I upload a file on NewBill Page", () => {
    test("Then an alert with an error message should be displayed with a unsupported file format", async () => {
      const fileInput = screen.getByTestId("file");
      const testFile = new File(["testFile"], "test.txt", {
        type: "text/txt",
      });

      await userEvent.upload(fileInput, testFile);

      expect(fileInput.files[0]).toStrictEqual(testFile);
      expect(window.alert).toHaveBeenCalledWith(
        "Erreur : Seuls les fichiers d'image (jpg, png, jpeg) sont acceptés."
      );
    });
  });

  describe("When I do fill fields in correct format and I click on submit button", () => {
    test("Then the submission process should work properly, and I should be sent on the Bills Page", async () => {
      const mockOnNavigate = jest.fn(pathname => {
        document.body.innerHTML = ROUTES({ pathname });
      });

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const inputData = bills[0];

      const newBillForm = screen.getByTestId("form-new-bill");

      const handleSubmit = jest.fn(newBill.handleSubmit);

      newBill.onNavigate = mockOnNavigate;

      const imageInput = screen.getByTestId("file");

      const file = new File(["img"], inputData.fileName, {
        type: ["image/jpg"],
      });

      selectTypeDepense(inputData.type);
      userEvent.type(getNomDepense(), inputData.name);
      userEvent.type(getMontant(), inputData.amount.toString());
      userEvent.type(getDate(), inputData.date);
      userEvent.type(getVat(), inputData.vat.toString());
      userEvent.type(getPct(), inputData.pct.toString());
      userEvent.type(getCommentary(), inputData.commentary);
      userEvent.upload(imageInput, file);

      newBill.fileName = file.name;

      const submitButton = screen.getByRole("button", { name: /envoyer/i });
      newBillForm.addEventListener("submit", handleSubmit);
      userEvent.click(submitButton);
      
      expect(handleSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
    });
  });
})

const selectTypeDepense = expenseType => {
  const dropdown = screen.getByRole("combobox");
  userEvent.selectOptions(
    dropdown,
    within(dropdown).getByRole("option", { name: expenseType })
  );
  return dropdown;
};

const getNomDepense = () => screen.getByTestId("expense-name");

const getMontant = () => screen.getByTestId("amount");

const getDate = () => screen.getByTestId("datepicker");

const getVat = () => screen.getByTestId("vat");

const getPct = () => screen.getByTestId("pct");

const getCommentary = () => screen.getByTestId("commentary");