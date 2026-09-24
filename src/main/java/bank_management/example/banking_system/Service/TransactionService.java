package bank_management.example.banking_system.Service;

import bank_management.example.banking_system.Dto.DepositRequestDto;
import bank_management.example.banking_system.Dto.TransactionResponseDto;
import bank_management.example.banking_system.Dto.TransferRequestDto;
import bank_management.example.banking_system.Dto.WithdrawRequestDto;
import bank_management.example.banking_system.Entity.Account;
import bank_management.example.banking_system.Entity.Transaction;
import bank_management.example.banking_system.Exception.InsufficientBalanceException;
import bank_management.example.banking_system.Exception.InvalidTransactionException;
import bank_management.example.banking_system.Exception.ResourceNotFoundException;
import bank_management.example.banking_system.Repository.AccountRepository;
import bank_management.example.banking_system.Repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public TransactionResponseDto deposit(DepositRequestDto request) {
        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new InvalidTransactionException("Deposit amount must be greater than zero.");
        }

        Account account = accountRepository.findByAccountNo(request.getAccountNo())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with number: " + request.getAccountNo()));

        if ("CLOSED".equalsIgnoreCase(account.getStatus())) {
            throw new InvalidTransactionException("Cannot deposit to a closed account.");
        }

        double newBalance = account.getBalance() + request.getAmount();
        account.setBalance(newBalance);
        account.setModifiedAt(OffsetDateTime.now());
        accountRepository.save(account);

        Transaction transaction = Transaction.builder()
                .transactionNo(generateTransactionNumber())
                .fromAcct(null)
                .toAccount(account)
                .transactionType("DEPOSIT")
                .amount(request.getAmount())
                .remainingBalance(newBalance)
                .description(request.getDescription() != null ? request.getDescription() : "Cash/Online Deposit")
                .createdAt(OffsetDateTime.now())
                .build();

        Transaction savedTxn = transactionRepository.save(transaction);
        return mapToResponseDto(savedTxn);
    }

    @Transactional
    public TransactionResponseDto withdraw(WithdrawRequestDto request) {
        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new InvalidTransactionException("Withdrawal amount must be greater than zero.");
        }

        Account account = accountRepository.findByAccountNo(request.getAccountNo())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with number: " + request.getAccountNo()));

        if ("CLOSED".equalsIgnoreCase(account.getStatus())) {
            throw new InvalidTransactionException("Cannot withdraw from a closed account.");
        }

        if (account.getBalance() < request.getAmount()) {
            throw new InsufficientBalanceException(
                    String.format("Insufficient funds. Available balance: %.2f, Requested withdrawal: %.2f",
                            account.getBalance(), request.getAmount())
            );
        }

        double newBalance = account.getBalance() - request.getAmount();
        account.setBalance(newBalance);
        account.setModifiedAt(OffsetDateTime.now());
        accountRepository.save(account);

        Transaction transaction = Transaction.builder()
                .transactionNo(generateTransactionNumber())
                .fromAcct(account)
                .toAccount(null)
                .transactionType("WITHDRAWAL")
                .amount(request.getAmount())
                .remainingBalance(newBalance)
                .description(request.getDescription() != null ? request.getDescription() : "Cash/ATM Withdrawal")
                .createdAt(OffsetDateTime.now())
                .build();

        Transaction savedTxn = transactionRepository.save(transaction);
        return mapToResponseDto(savedTxn);
    }

    @Transactional
    public TransactionResponseDto transfer(TransferRequestDto request) {
        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new InvalidTransactionException("Transfer amount must be greater than zero.");
        }

        if (request.getFromAccountNo().trim().equalsIgnoreCase(request.getToAccountNo().trim())) {
            throw new InvalidTransactionException("Source and destination accounts cannot be the same.");
        }

        Account fromAccount = accountRepository.findByAccountNo(request.getFromAccountNo())
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found with number: " + request.getFromAccountNo()));

        Account toAccount = accountRepository.findByAccountNo(request.getToAccountNo())
                .orElseThrow(() -> new ResourceNotFoundException("Destination account not found with number: " + request.getToAccountNo()));

        if ("CLOSED".equalsIgnoreCase(fromAccount.getStatus())) {
            throw new InvalidTransactionException("Cannot transfer from a closed account.");
        }
        if ("CLOSED".equalsIgnoreCase(toAccount.getStatus())) {
            throw new InvalidTransactionException("Cannot transfer to a closed account.");
        }

        if (fromAccount.getBalance() < request.getAmount()) {
            throw new InsufficientBalanceException(
                    String.format("Insufficient funds in source account. Available balance: %.2f, Requested transfer: %.2f",
                            fromAccount.getBalance(), request.getAmount())
            );
        }

        // Deduct from sender
        double senderNewBalance = fromAccount.getBalance() - request.getAmount();
        fromAccount.setBalance(senderNewBalance);
        fromAccount.setModifiedAt(OffsetDateTime.now());

        // Credit to recipient
        double recipientNewBalance = toAccount.getBalance() + request.getAmount();
        toAccount.setBalance(recipientNewBalance);
        toAccount.setModifiedAt(OffsetDateTime.now());

        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        Transaction transaction = Transaction.builder()
                .transactionNo(generateTransactionNumber())
                .fromAcct(fromAccount)
                .toAccount(toAccount)
                .transactionType("TRANSFER")
                .amount(request.getAmount())
                .remainingBalance(senderNewBalance)
                .description(request.getDescription() != null ? request.getDescription() : "Fund Transfer")
                .createdAt(OffsetDateTime.now())
                .build();

        Transaction savedTxn = transactionRepository.save(transaction);
        return mapToResponseDto(savedTxn);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponseDto> getAllTransactions() {
        return transactionRepository.findAll().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TransactionResponseDto getTransactionById(Long id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
        return mapToResponseDto(transaction);
    }

    @Transactional(readOnly = true)
    public TransactionResponseDto getTransactionByNumber(String txnNo) {
        Transaction transaction = transactionRepository.findByTransactionNo(txnNo)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with transaction number: " + txnNo));
        return mapToResponseDto(transaction);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponseDto> getAccountStatement(String accountNo) {
        if (!accountRepository.existsByAccountNo(accountNo)) {
            throw new ResourceNotFoundException("Account not found with account number: " + accountNo);
        }
        return transactionRepository.findTransactionsByAccountNo(accountNo).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    private String generateTransactionNumber() {
        return "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + System.currentTimeMillis() % 10000;
    }

    public TransactionResponseDto mapToResponseDto(Transaction transaction) {
        return TransactionResponseDto.builder()
                .id(transaction.getId())
                .transactionNo(transaction.getTransactionNo())
                .transactionType(transaction.getTransactionType())
                .amount(transaction.getAmount())
                .remainingBalance(transaction.getRemainingBalance())
                .fromAccountNo(transaction.getFromAcct() != null ? transaction.getFromAcct().getAccountNo() : null)
                .toAccountNo(transaction.getToAccount() != null ? transaction.getToAccount().getAccountNo() : null)
                .description(transaction.getDescription())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}
