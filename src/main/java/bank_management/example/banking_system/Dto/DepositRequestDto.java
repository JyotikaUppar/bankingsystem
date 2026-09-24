package bank_management.example.banking_system.Dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DepositRequestDto {

    @NotBlank(message = "Account number is required")
    private String accountNo;

    @NotNull(message = "Deposit amount is required")
    @DecimalMin(value = "1.0", message = "Deposit amount must be at least 1.00")
    private Double amount;

    private String description;
}
