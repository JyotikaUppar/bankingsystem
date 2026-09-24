package bank_management.example.banking_system.Controller;

import bank_management.example.banking_system.Dto.*;
import bank_management.example.banking_system.Service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping("/deposit")
    public ResponseEntity<ApiResponse<TransactionResponseDto>> deposit(@Valid @RequestBody DepositRequestDto request) {
        TransactionResponseDto response = transactionService.deposit(request);
        return ResponseEntity.ok(ApiResponse.success("Deposit completed successfully", response));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<TransactionResponseDto>> withdraw(@Valid @RequestBody WithdrawRequestDto request) {
        TransactionResponseDto response = transactionService.withdraw(request);
        return ResponseEntity.ok(ApiResponse.success("Withdrawal completed successfully", response));
    }

    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<TransactionResponseDto>> transfer(@Valid @RequestBody TransferRequestDto request) {
        TransactionResponseDto response = transactionService.transfer(request);
        return ResponseEntity.ok(ApiResponse.success("Transfer completed successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TransactionResponseDto>>> getAllTransactions() {
        List<TransactionResponseDto> transactions = transactionService.getAllTransactions();
        return ResponseEntity.ok(ApiResponse.success("Transactions retrieved successfully", transactions));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponseDto>> getTransactionById(@PathVariable Long id) {
        TransactionResponseDto transaction = transactionService.getTransactionById(id);
        return ResponseEntity.ok(ApiResponse.success("Transaction retrieved successfully", transaction));
    }

    @GetMapping("/reference/{transactionNo}")
    public ResponseEntity<ApiResponse<TransactionResponseDto>> getTransactionByNumber(@PathVariable String transactionNo) {
        TransactionResponseDto transaction = transactionService.getTransactionByNumber(transactionNo);
        return ResponseEntity.ok(ApiResponse.success("Transaction retrieved successfully", transaction));
    }

    @GetMapping("/statement/{accountNo}")
    public ResponseEntity<ApiResponse<List<TransactionResponseDto>>> getAccountStatement(@PathVariable String accountNo) {
        List<TransactionResponseDto> statement = transactionService.getAccountStatement(accountNo);
        return ResponseEntity.ok(ApiResponse.success("Account statement retrieved successfully", statement));
    }
}
