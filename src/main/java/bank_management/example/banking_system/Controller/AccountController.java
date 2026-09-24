package bank_management.example.banking_system.Controller;

import bank_management.example.banking_system.Dto.AccountRequestDto;
import bank_management.example.banking_system.Dto.AccountResponseDto;
import bank_management.example.banking_system.Dto.ApiResponse;
import bank_management.example.banking_system.Service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    public ResponseEntity<ApiResponse<AccountResponseDto>> createAccount(@Valid @RequestBody AccountRequestDto request) {
        AccountResponseDto createdAccount = accountService.createAccount(request);
        return new ResponseEntity<>(ApiResponse.success("Account created successfully", createdAccount), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AccountResponseDto>>> getAllAccounts() {
        List<AccountResponseDto> accounts = accountService.getAllAccounts();
        return ResponseEntity.ok(ApiResponse.success("Accounts retrieved successfully", accounts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponseDto>> getAccountById(@PathVariable Long id) {
        AccountResponseDto account = accountService.getAccountById(id);
        return ResponseEntity.ok(ApiResponse.success("Account retrieved successfully", account));
    }

    @GetMapping("/number/{accountNo}")
    public ResponseEntity<ApiResponse<AccountResponseDto>> getAccountByAccountNo(@PathVariable String accountNo) {
        AccountResponseDto account = accountService.getAccountByAccountNo(accountNo);
        return ResponseEntity.ok(ApiResponse.success("Account retrieved successfully", account));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<AccountResponseDto>>> getAccountsByUserId(@PathVariable Long userId) {
        List<AccountResponseDto> accounts = accountService.getAccountsByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("User accounts retrieved successfully", accounts));
    }

    @GetMapping("/{accountNo}/balance")
    public ResponseEntity<ApiResponse<Double>> getBalance(@PathVariable String accountNo) {
        Double balance = accountService.getBalance(accountNo);
        return ResponseEntity.ok(ApiResponse.success("Account balance retrieved successfully", balance));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponseDto>> closeAccount(@PathVariable Long id) {
        AccountResponseDto closedAccount = accountService.closeAccount(id);
        return ResponseEntity.ok(ApiResponse.success("Account closed successfully", closedAccount));
    }
}
