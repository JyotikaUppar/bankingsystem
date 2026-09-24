package bank_management.example.banking_system.Repository;

import bank_management.example.banking_system.Entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByAccountNo(String accountNo);
    boolean existsByAccountNo(String accountNo);
    List<Account> findByUsersId(Long userId);
}
