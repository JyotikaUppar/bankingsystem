package bank_management.example.banking_system.Service;

import bank_management.example.banking_system.Dto.AccountResponseDto;
import bank_management.example.banking_system.Dto.UserRequestDto;
import bank_management.example.banking_system.Dto.UserResponseDto;
import bank_management.example.banking_system.Entity.Account;
import bank_management.example.banking_system.Entity.Users;
import bank_management.example.banking_system.Exception.DuplicateResourceException;
import bank_management.example.banking_system.Exception.ResourceNotFoundException;
import bank_management.example.banking_system.Repository.AccountRepository;
import bank_management.example.banking_system.Repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsersService {

    private final UsersRepository usersRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public UserResponseDto createUser(UserRequestDto request) {
        if (usersRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User already exists with email: " + request.getEmail());
        }

        Users user = Users.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(request.getPassword())
                .age(request.getAge())
                .gender(request.getGender())
                .address(request.getAddress())
                .phoneNumber(request.getPhoneNumber())
                .createdAt(OffsetDateTime.now())
                .build();

        Users savedUser = usersRepository.save(user);
        return mapToUserResponseDto(savedUser, null);
    }

    @Transactional(readOnly = true)
    public List<UserResponseDto> getAllUsers() {
        return usersRepository.findAll().stream()
                .map(user -> {
                    List<Account> accounts = accountRepository.findByUsersId(user.getId());
                    return mapToUserResponseDto(user, accounts);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponseDto getUserById(Long id) {
        Users user = usersRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        List<Account> accounts = accountRepository.findByUsersId(user.getId());
        return mapToUserResponseDto(user, accounts);
    }

    @Transactional
    public UserResponseDto updateUser(Long id, UserRequestDto request) {
        Users user = usersRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && usersRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already in use: " + request.getEmail());
        }

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(request.getPassword());
        }
        user.setAge(request.getAge());
        user.setGender(request.getGender());
        user.setAddress(request.getAddress());
        user.setPhoneNumber(request.getPhoneNumber());

        Users updatedUser = usersRepository.save(user);
        List<Account> accounts = accountRepository.findByUsersId(updatedUser.getId());
        return mapToUserResponseDto(updatedUser, accounts);
    }

    @Transactional
    public void deleteUser(Long id) {
        Users user = usersRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        usersRepository.delete(user);
    }

    public UserResponseDto mapToUserResponseDto(Users user, List<Account> accounts) {
        List<AccountResponseDto> accountDtos = null;
        if (accounts != null) {
            accountDtos = accounts.stream()
                    .map(this::mapToAccountResponseDto)
                    .collect(Collectors.toList());
        }

        return UserResponseDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .age(user.getAge())
                .gender(user.getGender())
                .address(user.getAddress())
                .phoneNumber(user.getPhoneNumber())
                .createdAt(user.getCreatedAt())
                .accounts(accountDtos)
                .build();
    }

    private AccountResponseDto mapToAccountResponseDto(Account account) {
        String holderName = (account.getUsers() != null)
                ? (account.getUsers().getFirstName() + " " + (account.getUsers().getLastName() != null ? account.getUsers().getLastName() : "")).trim()
                : null;

        return AccountResponseDto.builder()
                .id(account.getId())
                .accountNo(account.getAccountNo())
                .userId(account.getUsers() != null ? account.getUsers().getId() : null)
                .accountHolderName(holderName)
                .balance(account.getBalance())
                .acctType(account.getAcctType())
                .status(account.getStatus())
                .createdAt(account.getCreatedAt())
                .modifiedAt(account.getModifiedAt())
                .build();
    }
}
