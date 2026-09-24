package bank_management.example.banking_system;

import com.jayway.jsonpath.JsonPath;
import bank_management.example.banking_system.Controller.AccountController;
import bank_management.example.banking_system.Controller.TransactionController;
import bank_management.example.banking_system.Controller.UsersController;
import bank_management.example.banking_system.Dto.*;
import bank_management.example.banking_system.Exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("h2")
class BankingSystemApiIntegrationTest {

    @Autowired
    private UsersController usersController;

    @Autowired
    private AccountController accountController;

    @Autowired
    private TransactionController transactionController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(usersController, accountController, transactionController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void fullBankingWorkflowTest() throws Exception {
        // 1. Create User 1
        String user1Json = """
            {
                "firstName": "John",
                "lastName": "Doe",
                "email": "john.doe@example.com",
                "password": "securePassword123",
                "age": 28,
                "gender": "Male",
                "address": "123 Main St, New York",
                "phoneNumber": "+1234567890"
            }
            """;

        MvcResult user1Result = mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(user1Json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.firstName", is("John")))
                .andExpect(jsonPath("$.data.email", is("john.doe@example.com")))
                .andReturn();

        Number user1IdNum = JsonPath.read(user1Result.getResponse().getContentAsString(), "$.data.id");
        Long user1Id = user1IdNum.longValue();

        // 2. Open Account for User 1 with initial deposit of 500.0
        String account1Json = String.format("""
            {
                "userId": %d,
                "initialDeposit": 500.0,
                "acctType": "SAVINGS"
            }
            """, user1Id);

        MvcResult account1Result = mockMvc.perform(post("/api/accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(account1Json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.balance", is(500.0)))
                .andExpect(jsonPath("$.data.acctType", is("SAVINGS")))
                .andReturn();

        String accountNo1 = JsonPath.read(account1Result.getResponse().getContentAsString(), "$.data.accountNo");

        // 3. Deposit 250.0 into Account 1
        String depositJson = String.format("""
            {
                "accountNo": "%s",
                "amount": 250.0,
                "description": "Bonus deposit"
            }
            """, accountNo1);

        mockMvc.perform(post("/api/transactions/deposit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(depositJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.amount", is(250.0)))
                .andExpect(jsonPath("$.data.remainingBalance", is(750.0)));

        // 4. Withdraw 100.0 from Account 1
        String withdrawJson = String.format("""
            {
                "accountNo": "%s",
                "amount": 100.0,
                "description": "ATM withdrawal"
            }
            """, accountNo1);

        mockMvc.perform(post("/api/transactions/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(withdrawJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.remainingBalance", is(650.0)));

        // 5. Create User 2 and Account 2
        String user2Json = """
            {
                "firstName": "Jane",
                "lastName": "Smith",
                "email": "jane.smith@example.com",
                "password": "securePassword456",
                "age": 32,
                "gender": "Female",
                "address": "456 Market St, Boston",
                "phoneNumber": "+1987654321"
            }
            """;

        MvcResult user2Result = mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(user2Json))
                .andExpect(status().isCreated())
                .andReturn();

        Number user2IdNum = JsonPath.read(user2Result.getResponse().getContentAsString(), "$.data.id");
        Long user2Id = user2IdNum.longValue();

        String account2Json = String.format("""
            {
                "userId": %d,
                "initialDeposit": 100.0,
                "acctType": "CURRENT"
            }
            """, user2Id);

        MvcResult account2Result = mockMvc.perform(post("/api/accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(account2Json))
                .andExpect(status().isCreated())
                .andReturn();

        String accountNo2 = JsonPath.read(account2Result.getResponse().getContentAsString(), "$.data.accountNo");

        // 6. Transfer 150.0 from Account 1 to Account 2
        String transferJson = String.format("""
            {
                "fromAccountNo": "%s",
                "toAccountNo": "%s",
                "amount": 150.0,
                "description": "Rent split"
            }
            """, accountNo1, accountNo2);

        mockMvc.perform(post("/api/transactions/transfer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(transferJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.amount", is(150.0)))
                .andExpect(jsonPath("$.data.remainingBalance", is(500.0)));

        // 7. Verify balance of Account 2 is 100.0 + 150.0 = 250.0
        mockMvc.perform(get("/api/accounts/" + accountNo2 + "/balance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", is(250.0)));

        // 8. Test Insufficient Funds Exception
        String overdrawJson = String.format("""
            {
                "fromAccountNo": "%s",
                "toAccountNo": "%s",
                "amount": 999999.0,
                "description": "Too large transfer"
            }
            """, accountNo1, accountNo2);

        mockMvc.perform(post("/api/transactions/transfer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(overdrawJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Insufficient Balance")));

        // 9. Verify Account 1 Statement has transactions
        mockMvc.perform(get("/api/transactions/statement/" + accountNo1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(3))));
    }
}
