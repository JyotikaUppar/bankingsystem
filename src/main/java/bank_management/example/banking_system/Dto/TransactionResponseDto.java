package bank_management.example.banking_system.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TransactionResponseDto {
    private Long id;
    private String transactionNo;
    private String transactionType;
    private Double amount;
    private Double remainingBalance;
    private String fromAccountNo;
    private String toAccountNo;
    private String description;
    private OffsetDateTime createdAt;
}
