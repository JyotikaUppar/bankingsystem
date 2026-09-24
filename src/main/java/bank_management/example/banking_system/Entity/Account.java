package bank_management.example.banking_system.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "user_accounts")
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_no", nullable = false, unique = true)
    private String accountNo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private Users users;

    @Column(name = "balance", nullable = false)
    private Double balance;

    @Column(name = "acct_type", nullable = false)
    private String acctType; // SAVINGS, CURRENT, etc.

    @Column(name = "status")
    private String status; // ACTIVE, CLOSED, FROZEN

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "modified_at")
    private OffsetDateTime modifiedAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
        if (this.modifiedAt == null) {
            this.modifiedAt = OffsetDateTime.now();
        }
        if (this.status == null) {
            this.status = "ACTIVE";
        }
        if (this.balance == null) {
            this.balance = 0.0;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.modifiedAt = OffsetDateTime.now();
    }
}
