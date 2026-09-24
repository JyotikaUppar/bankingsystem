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
public class TransferRequestDto {

    @NotBlank(message = "Source account number (fromAccountNo) is required")
    private String fromAccountNo;

    @NotBlank(message = "Destination account number (toAccountNo) is required")
    private String toAccountNo;

    @NotNull(message = "Transfer amount is required")
    @DecimalMin(value = "1.0", message = "Transfer amount must be at least 1.00")
    private Double amount;

    private String description;
}
