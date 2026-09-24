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
public class AccountResponseDto {
    private Long id;
    private String accountNo;
    private Long userId;
    private String accountHolderName;
    private Double balance;
    private String acctType;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime modifiedAt;
}
