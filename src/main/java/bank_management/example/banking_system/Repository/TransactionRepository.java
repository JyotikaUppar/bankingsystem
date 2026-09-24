package bank_management.example.banking_system.Repository;

import bank_management.example.banking_system.Entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Optional<Transaction> findByTransactionNo(String transactionNo);

    @Query("SELECT t FROM Transaction t LEFT JOIN t.fromAcct f LEFT JOIN t.toAccount ta WHERE f.accountNo = :accountNo OR ta.accountNo = :accountNo ORDER BY t.createdAt DESC")
    List<Transaction> findTransactionsByAccountNo(@Param("accountNo") String accountNo);

    @Query("SELECT t FROM Transaction t LEFT JOIN t.fromAcct f LEFT JOIN t.toAccount ta WHERE f.id = :accountId OR ta.id = :accountId ORDER BY t.createdAt DESC")
    List<Transaction> findTransactionsByAccountId(@Param("accountId") Long accountId);
}
