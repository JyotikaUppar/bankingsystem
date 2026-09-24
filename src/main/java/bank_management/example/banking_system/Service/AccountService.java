package bank_management.example.banking_system.Service;

import bank_management.example.banking_system.Dto.AccountRequestDto;
import bank_management.example.banking_system.Dto.AccountResponseDto;
import bank_management.example.banking_system.Entity.Account;
import bank_management.example.banking_system.Entity.Transaction;
import bank_management.example.banking_system.Entity.Users;
import bank_management.example.banking_system.Exception.ResourceNotFoundException;
import bank_management.example.banking_system.Repository.AccountRepository;
import bank_management.example.banking_system.Repository.TransactionRepository;
import bank_management.example.banking_system.Repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UsersRepository usersRepository;
    private final TransactionRepository transactionRepository;

    private final SecureRandom random = new SecureRandom();

    @Transactional
    public AccountResponseDto createAccount(AccountRequestDto request) {
        Users user = usersRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Cannot create account. User not found with id: " + request.getUserId()));

        Double initialDeposit = (request.getInitialDeposit() != null && request.getInitialDeposit() >= 0)
                ? request.getInitialDeposit()
                : 0.0;

        String accountNo = generateUniqueAccountNumber();

        Account account = Account.builder()
                .accountNo(accountNo)
                .users(user)
                .balance(initialDeposit)
                .acctType(request.getAcctType().toUpperCase())
                .status("ACTIVE")
                .createdAt(OffsetDateTime.now())
                .modifiedAt(OffsetDateTime.now())
                .build();

        Account savedAccount = accountRepository.save(account);

        // Record initial deposit transaction if amount > 0
        if (initialDeposit > 0) {
            Transaction initialTxn = Transaction.builder()
                    .transactionNo("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .fromAcct(null)
                    .toAccount(savedAccount)
                    .transactionType("DEPOSIT")
                    .amount(initialDeposit)
                    .remainingBalance(initialDeposit)
                    .description("Initial account opening deposit")
                    .createdAt(OffsetDateTime.now())
                    .build();
            transactionRepository.save(initialTxn);
        }

        return mapToResponseDto(savedAccount);
    }

    @Transactional(readOnly = true)
    public List<AccountResponseDto> getAllAccounts() {
        return accountRepository.findAll().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AccountResponseDto getAccountById(Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + id));
        return mapToResponseDto(account);
    }

    @Transactional(readOnly = true)
    public AccountResponseDto getAccountByAccountNo(String accountNo) {
        Account account = accountRepository.findByAccountNo(accountNo)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with account number: " + accountNo));
        return mapToResponseDto(account);
    }

    @Transactional(readOnly = true)
    public List<AccountResponseDto> getAccountsByUserId(Long userId) {
        if (!usersRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }
        return accountRepository.findByUsersId(userId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Double getBalance(String accountNo) {
        Account account = accountRepository.findByAccountNo(accountNo)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with account number: " + accountNo));
        return account.getBalance();
    }

    @Transactional
    public AccountResponseDto closeAccount(Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + id));
        account.setStatus("CLOSED");
        account.setModifiedAt(OffsetDateTime.now());
        Account updated = accountRepository.save(account);
        return mapToResponseDto(updated);
    }

    private String generateUniqueAccountNumber() {
        String accountNo;
        do {
            long number = 1000000000L + (long) (random.nextDouble() * 9000000000L);
            accountNo = String.valueOf(number);
        } while (accountRepository.existsByAccountNo(accountNo));
        return accountNo;
    }

    public AccountResponseDto mapToResponseDto(Account account) {
        String holderName = null;
        Long userId = null;
        if (account.getUsers() != null) {
            userId = account.getUsers().getId();
            holderName = (account.getUsers().getFirstName() + " " + (account.getUsers().getLastName() != null ? account.getUsers().getLastName() : "")).trim();
        }

        return AccountResponseDto.builder()
                .id(account.getId())
                .accountNo(account.getAccountNo())
                .userId(userId)
                .accountHolderName(holderName)
                .balance(account.getBalance())
                .acctType(account.getAcctType())
                .status(account.getStatus())
                .createdAt(account.getCreatedAt())
                .modifiedAt(account.getModifiedAt())
                .build();
    }
}
